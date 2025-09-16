import subprocess
import re
import os
import difflib
import shutil
import time

from llm import get_command_from_instruction,get_fixed_command,get_fixed_code
from executor import run_shell_command
from rich import print
# from dir_aware import dry_run_check
from terminal_ui import ask_user_choice
from tools import use_tool


supported_languages={
    ".py":{
        "run":lambda file: ["python",file],
        "ext":"python"
    },
    ".js":{
        "run":lambda file: ["node",file],
        "ext":"javascript"
    },
    ".rs":{
        "run":lambda file:["rustc",file],
        "post_run":lambda file:["./",os.path.splitext(os.basename(file)[0])],
        "ext":"rust"
    },
    ".ts":{
        "run":lambda file:["ts-node",file],
        "ext":"typescript"
    },
    ".java":{
        "run":lambda file:["javac",file],
        "post_run":lambda file:["java",os.path.splitext(os.path.basename(file)[0])],
        "ext":"java"
    },
    ".c":{
        "run":lambda file:["gcc",file,"-o","a.out"],
        "post_run":lambda file:["./a.out"],
        "ext":"c"
    },
     ".cpp": {
        "run": lambda file: ["g++", file, "-o", "a.out"],
        "post_run": lambda file: ["./a.out"],
        "ext": "cpp"
    }
}



def extract_steps(response: str):
    steps = []
    # Match "command -----" or "code filename.EXT -----" followed by content
    pattern = r"(command|code ([\w\.\-]+)) -----(.*?)(?=(?:command|code [\w\.\-]+) -----|$)"
    for match in re.finditer(pattern, response, re.DOTALL):
        step_type = match.group(1).strip()
        filename = match.group(2)
        content = match.group(3).strip()
        
        if step_type == "command" and content:
            steps.append(("command", content))
        elif step_type.startswith("code") and filename and content:
            steps.append((f"code {filename}", content))
    return steps



def process_instruction(instruction:str):

    # this is for the file update that already exist
    exts = ["py","js","rs","ts","java","c","cpp"]
    pattern = rf"\b([\w./-]+\.({'|'.join(exts)}))\b"
    match = re.search(pattern, instruction, re.IGNORECASE)
    if match and "fix" in instruction.lower():
        filename = os.path.abspath(match.group(1))
        if os.path.exists(filename):
            print(f"[bold green]Debugging existing file: {filename}[/bold green]")
            run_and_debug_code(filename)
        else:
            print(f"[bold red]File '{filename}' not found.[/bold red]")
        return


    print(f"[bold cyan]Instruction:[/bold cyan] {instruction}")

    response=get_command_from_instruction(instruction)
    steps=extract_steps(response)

    for step_type, content in steps:
        if step_type == "command":
            command_lines=content.strip().split('\n')
            current_command=command_lines[0].strip()

            if '\n' in content or not re.match(r"^[\w\-./= ]+", content):
                print(f"[yellow]Skipping invalid command block:[/yellow] {content}")
                continue

            success=False
            attempts=0
            max_attempts=3
           

            while not success and attempts<max_attempts:
                print(f"[bold yellow]Running Command:[/bold yellow] {content}")
                stdout, stderr, returncode = run_shell_command(content,instruction)

                if stdout:
                    print(f"[green]Output:[/green]\n{stdout}")

                if stderr:
                    print(f"[yellow]Error Output:[/yellow]\n{stderr}")


                if returncode==0:
                    print(f"[green bold]Command finished succefully!.[/green bold]")
                    success=True
                else:
                    print(f"[red]Command failed with error:[/red] {stderr}")
                    current_command=get_fixed_command(instruction,current_command,stderr)
                    attempts+=1
                    
                    if attempts < max_attempts:
                        print(f"[blue]Asking model to fix command ...[/blue]")
                        fixed_command_suggestion=get_fixed_command(instruction,current_command,stderr)

                        if fixed_command_suggestion and fixed_command_suggestion != current_command:
                            current_command=fixed_command_suggestion.strip().split('\n')[0]
                            print(f"[yellow]Model suggested fix:[/yellow] {current_command}")
                        else:
                            print(f"[red]Model did not provide differnt command to provide fix.stopping retries.[/red]")
                            break
                    else:
                        print(f"[red]Model failed after {attempts}. Stopping retries.[/red] ")

            
            if not success:
                print(f"[red bold]Command failed after {attempts} attempts.Skipping.[/red bold]")


        elif step_type.startswith("code"):
            filename = step_type.split()[1]
            filename=os.path.abspath(filename)
            cleaned_code=strip_markdown_formatting(content)


            # all this does is write into files
            # result=use_tool(
            #     "file_edit",
            #     path=filename,
            #     content=cleaned_code,
            #     mode="w"
            # )

            # print(result)


            with open(filename, "w") as f:
                f.write(cleaned_code)

            print(f"[green]Code written to {filename}[/green]")

            print(f"[bold magenta]Do you want me to run and auto-debug {filename}?[/bold magenta]")
            choice=ask_user_choice()
            if choice == 'y':
                run_and_debug_code(filename)
            else:
                print(f"[yellow]Skipping execution of {filename}[/yellow]")
        

import re

# def strip_markdown_formatting(code: str) -> str:
#     """
#     Remove markdown fences (```lang ... ```), and strip out any
#     lines that look like explanations rather than actual code.
#     Works for all supported languages.
#     """
#     print("the code that is inserted here is ",code)

#     # 1. Remove any opening ```lang or ``` and closing ```
#     code = re.sub(r"^```[a-zA-Z0-9]*\s*\n?", "", code, flags=re.MULTILINE)
#     code = re.sub(r"\n?```$", "", code, flags=re.MULTILINE)

#     # 2. Split into lines, filter out pure explanation lines
#     lines = []
#     for line in code.splitlines():
#         stripped = line.strip()
#         if not stripped:
#             # skip empty lines if you like, or keep single newline
#             lines.append("")
#             continue

#         # heuristic: keep lines that start like code:
#         #   comment markers, typical code tokens, indentation
#         if re.match(r"^(\s*#|\s*//|\s*/\*|\s*\*|\w+\s*[:=\(\[].*)", line):
#             lines.append(line)
#         else:
#             # drop lines that are obviously prose
#             continue

#     # 3. Rejoin and return
#     #    collapse multiple blank lines if desired
#     cleaned = "\n".join(lines)
#     # optional: collapse >2 blank lines
#     cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
#     return cleaned.strip() + "\n"

def strip_markdown_formatting(code: str) -> str:
    return re.sub(r"```[a-zA-Z0-9]*\s*|```", "", code).strip() + "\n"


def run_and_debug_code(filepath:str):
    ext=os.path.splitext(filepath)[1]


    if ext not in supported_languages:
        print(f"[red]Unsupported file type: {ext}[/red]")
        return
    
    lang = supported_languages[ext]["ext"]
    runner = supported_languages[ext]["run"]
    post_runner = supported_languages[ext].get("post_run")

    with open(filepath, "r") as f:
        current_code = f.read()


    backup_path = filepath + ".bak"
    shutil.copy(filepath, backup_path)

    attempt = 0
    max_attempts = 3

    while attempt < max_attempts:
        print(f"[bold cyan]Attempt {attempt + 1}: Running {filepath}[/bold cyan]")
        try:
            result = subprocess.run(runner(filepath), capture_output=True, text=True)
            if result.returncode != 0:
                raise subprocess.CalledProcessError(result.returncode, runner(filepath), output=result.stdout, stderr=result.stderr)
            
            if post_runner:
                result = subprocess.run(post_runner(filepath), capture_output=True, text=True)
                if result.returncode != 0:
                    raise subprocess.CalledProcessError(result.returncode, post_runner(filepath), output=result.stdout, stderr=result.stderr)


            print("[green]Execution successful![/green]")
            print(result.stdout)
            return
        
        except subprocess.CalledProcessError as e:
            print(f"[red]Error during execution:[/red] {e.stderr}")
            print("[blue]Attempting to debug using LLM...[/blue]")

            

            fixed_code = get_fixed_code(strip_markdown_formatting(current_code), e.stderr, lang)

            clean_code=strip_markdown_formatting(fixed_code)
            
            # show diff between current and fixed code
            diff=difflib.unified_diff(
                current_code.splitlines(),
                clean_code.splitlines(),
                fromfile="Current Code",
                tofile="Fixed Code",
                lineterm=''
            )

            print("[bold magenta]Proposed Code  Diff:[/bold magenta]")
            for line in diff:
                if line.startswith('+'):
                    print(f"[green]{line}][/green]")
                elif line.startswith('-'):
                    print(f"[red]{line}[/red]")
                else:
                    print(line)

            
            # this will ask for confimration cool right heeheh
            choice=ask_user_choice();

            if choice == 'y':
                with open(filepath,'w') as f:
                    f.write(clean_code)

                current_code=clean_code
                
                print("[green]Fix applied![green]")
                time.sleep(1)
            else:
                print("[red]Fix rejected by user.[/red]")
                break
            
            attempt+=1
    
    # if it failed after many tried then just saved copy and quit 
    print(f"[bold red]Failed after {max_attempts} attempts or rejected.Rollbacking back to original code.[/bold red]")
    shutil.copy(backup_path,filepath)