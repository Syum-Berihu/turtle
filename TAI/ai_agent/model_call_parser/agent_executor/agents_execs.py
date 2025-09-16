import os
import subprocess
import json
import shutil
import time
import re
import tempfile

from prompt_template.task import Task
from .executor_base import BaseTool
from .llm_handlers import get_fixed_code

from openai import OpenAI
from dotenv import load_dotenv


deepseekapi=os.getenv("deep_seek_API")

client=OpenAI(api_key=deepseekapi,base_url="https://api.deepseek.com")

class createFoldertool(BaseTool):
    def run(self,args:dict)->dict:
        try:
            # print(f"the unfilitered reason is {args.get('reason','No reason provided')}!!!!")
            # reason= args.get('reason', 'Unknown reason')
            # print(f"reason is {reason}")
            # action_desc="creating new folder"
            # if not self.confirm_action(f"{action_desc.capitalize()}?", reason=reason):
            #     return {"status": "aborted", "message": "Operation aborted by user."}
            
            path=args['path']
            os.makedirs(path,exist_ok=True)
            return {"status":"success"}
        except Exception as e:
            return {"status":"error","error":str(e)}
        
class CreateFileTool(BaseTool):
    def run(self, args: dict) -> dict:
        try:
            # print(f"the unfilitered reason is {args.get('reason','No reason provided')}!!!!")
            # reason= args.get('reason', 'Unknown reason')
            # print(f"reasonnnnnn is {reason}")
            # action_desc="creating new file"
            # if not self.confirm_action(f"{action_desc.capitalize()} ?", reason=reason):
            #     return {"status": "aborted", "message": "Operation aborted by user."}

            path = args['path']
            dirpath = os.path.dirname(path)
            if dirpath and not os.path.exists(dirpath):
                os.makedirs(dirpath, exist_ok=True)
            with open(path, 'w') as f:
                pass
            return {"status": "success"}
        except Exception as e:
            return {"status": "error", "error": str(e)}


class EditFileTool(BaseTool):
    def run(self, args: dict) -> dict:
        try:
            # reason= args.get('reason', 'Unknown reason')
            # action_desc="appending" if mode == "a" else "overwriting"
            # if not self.confirm_action(f"{action_desc.capitalize()} content to {path}?", reason=reason):
            #     return {"status": "aborted", "message": "Operation aborted by user."}
            
            # print("mdedendnednend ddudndunduednuend")
        
            path=args['path']
            content=args.get("content","").strip()
            mode_input=args.get("mode","append").lower()

            # if not content:
            #     return {"status":"error","error":"No content provided to write"}
            
            if mode_input == "append":
                mode="a"
            elif mode_input=="overwrite":
                mode="w"
            else:
                return {"status":"error","error":f"Invalid mode:use 'overwrite' or 'append'"}
            
            # print(f"the unfilitered reason is {args.get('reason','No reason provided')}!!!!")
           
            if mode == "a" and not content:
                return {"status":"error","error":"No content provided to append"}
            
            # reason= args.get('reason', 'Unknown reason')
            # action_desc="appending" if mode == "a" else "overwriting"

            # if not self.confirm_action(f"{action_desc.capitalize()} content to {path}?", reason=reason):
            #     return {"status": "aborted", "message": "Operation aborted by user."}

            content=self.clean_code_block(content)

            with open(path,mode) as f:
                f.write(content)
            
            return {"status":"success","message":"Content written to file."}
        except Exception as e:
            return {"status":"error","error":str(e)}

    def clean_code_block(self,text:str)->str:
        match = re.search(r"```(?:\w+)?\n(.*?)```", text, re.DOTALL)
        return match.group(1).strip() if match else text.strip()

     
class ChangeDirTool(BaseTool):
    def run(self, args: dict) -> dict:
        try:
            path = args['path']
            os.chdir(path)
            return {"status": "success"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

# updating this one to meeet jossy's need damn 
class ListDirTool(BaseTool):
    def run(self, args: dict) -> dict:
        try:
            path = args.get('path', '.')
            contents = os.listdir(path)

            contents.sort()

            formatted_output=" ".join(contents)
            # formatted_output=[]
            # for item in contents:
            #     item_path = os.path.join(path, item)
            #     if os.path.isdir(item_path):
            #         formatted_output.append(f"[blue]{item}/[/blue]")
            #     elif os.path.isfile(item_path):
            #         formatted_output.append(f"[green]{item}[/ green]")
            #     else:
            #         formatted_output.append(f"[ yellow]{item}[/ yellow]")
            # print(formatted_output)
            return {"status": "success", "output": formatted_output}
        except Exception as e:
            return {"status": "error", "error": str(e)}
        

class ExplainedCodeTool(BaseTool):
    def run(self,args:dict):
        try:
            path=args['path']
            if not os.path.isfile(path):
                return {"status":"error","error":f"File not found:{path}"}
            with open(path, 'r') as f:
                code_content=f.read()

            prompt = f"""
                    You are a code analyst. Please explain the following code in simple terms.
                    If there are functions or logic, describe what they do line by line.
                    Also, mention any potential bugs or improvements if applicable.

                    Here is the code:
                """
            response=client.chat.completions.create(
                model="deepseek-chat",
                messages=[{"role": "user", "content": prompt + code_content}],
            )

            explnation=response.choices[0].message.content.strip()

            return {"status": "success", "output": explnation}
        
        except Exception as e:
            return {"status":"error","error":str(e)}

class RunCodeTool(BaseTool):
    supported_languages = {
        ".py": {
            "run": lambda file: ["python", file],
            "ext": "python"
        },
        ".js": {
            "run": lambda file: ["node", file],
            "ext": "javascript"
        },
        ".rs": {
            "run": lambda file: ["rustc", file],
            "post_run": lambda file: ["./" + os.path.splitext(os.path.basename(file))[0]],
            "ext": "rust"
        },
        ".ts": {
            "run": lambda file: ["ts-node", file],
            "ext": "typescript"
        },
        ".java": {
            "run": lambda file: ["javac", file],
            "post_run": lambda file: ["java", os.path.splitext(os.path.basename(file))[0]],
            "ext": "java"
        },
        ".c": {
            "run": lambda file: ["gcc", file, "-o", "a.out"],
            "post_run": lambda file: ["./a.out"],
            "ext": "c"
        },
        ".cpp": {
            "run": lambda file: ["g++", file, "-o", "a.out"],
            "post_run": lambda file: ["./a.out"],
            "ext": "cpp"
        }
    }

    def run(self, args: dict) -> dict:
        try:
            filepath = args['path']
            ext = os.path.splitext(filepath)[1]
            
            if ext not in self.supported_languages:
                return {"status": "error", "error": f"Unsupported file type: {ext}"}

            lang_conf = self.supported_languages[ext]
            run_cmd = lang_conf["run"](filepath)
            post_cmd = lang_conf.get("post_run")

            result = subprocess.run(run_cmd, capture_output=True, text=True)
            if result.returncode != 0:
                return {"status": "error", "error": result.stderr}

            if post_cmd:
                result = subprocess.run(post_cmd(filepath), capture_output=True, text=True)
                if result.returncode != 0:
                    return {"status": "error", "error": result.stderr}

            return {"status": "success", "output": result.stdout}

        except Exception as e:
            return {"status": "error", "error": str(e)}

class MoveFileTool(BaseTool):
    def run(self, args: dict) -> dict:
        try:
            # reason= args.get('reason', 'Unknown reason')
            # action_desc="moving file"
            # if not self.confirm_action(f"{action_desc.capitalize()} ?", reason=reason):
            #     return {"status": "aborted", "message": "Operation aborted by user."}
            
            src = args['src']
            dest = args['dest']
            os.rename(src, dest)
            return {"status": "success"}
        except Exception as e:
            return {"status": "error", "error": str(e)}
        
# this writes the generated code with llm 
class GenerateCodeTool(BaseTool):
    def run(self, args: dict) -> dict:
        try:
            # reason= args.get('reason', 'Unknown reason')
            # action_desc="appending" if mode == "a" else "overwriting"

            # if not self.confirm_action(f"{action_desc.capitalize()} ?", reason=reason):
            #     return {"status": "aborted", "message": "Operation aborted by user."}

            prompt = args['prompt']
            language = args.get('language', 'python')
            target = args['target_file']
            # mode = args.get('mode', 'append')

            # mode mapping 
            mode_input=args.get("mode","append").lower()
            if mode_input == 'append':
                mode='a'
            elif mode_input == 'overwrite':
                mode='w'
            else:
                return {"status":"error","error":f"invalid mode:'{mode_input}'"}
            

            # call the llm this
            llm_prompt = (
            f"Write valid {language} code that satisfies this requirement:\n"
            f"\"{prompt}\"\n"
            f"Respond ONLY with a markdown code block like this:\n\n"
            f"```{language}\n<your code here>\n```"
              )


            response=client.chat.completions.create(
                model="deepseek-chat",
                messages=[{"role":"user","content":llm_prompt}],
                temperature=0.2
            )

            raw_output=response.choices[0].message.content.strip()

            # cleanded output
            clean_output=self.clean_code(raw_output)

            # generated_code = f"# Generated {language} code for prompt: {prompt}\n"
            with open(target, mode) as f:
                f.write("\n"+clean_output+"\n")
            return {"status": "success"}
        except Exception as e:
            return {"status": "error", "error": str(e)}


    def clean_code(self, text: str) -> str:
    # Extract code inside triple backticks
        match = re.search(r"```(?:\w+)?\n(.*?)```", text, re.DOTALL)
        if match:
            code = match.group(1).strip()
        else:
            # Fallback: remove any stray backticks or explanation
            code = re.sub(r"```(?:\w+)?", "", text).strip("`\n ")

        # Optionally remove any '# Generated ...' lines
        lines = code.splitlines()
        clean_lines = [line for line in lines if not line.strip().startswith("# Generated")]
        return "\n".join(clean_lines)

# fixer of codes
SUPPORTED_LANGUAGES = {
    ".py": {
        "lang": "python",
        "run": lambda path: ["python", path],
    },
    ".js": {
        "lang": "javascript",
        "run": lambda path: ["node", path],
    },
    ".ts": {
        "lang": "typescript",
        "run": lambda path: ["tsc", path],
        "post_run": lambda path: ["node", os.path.splitext(path)[0] + ".js"],
    },
    ".cpp": {
        "lang": "cpp",
        "run": lambda path: ["g++", path, "-o", path.replace(".cpp", "")],
        "post_run": lambda path: [path.replace(".cpp", "")],
        "cleanup": lambda path: os.remove(path.replace(".cpp", ""))
    },
    ".c": {
        "lang": "c",
        "run": lambda path: ["gcc", path, "-o", path.replace(".c", "")],
        "post_run": lambda path: [path.replace(".c", "")],
        "cleanup": lambda path: os.remove(path.replace(".c", ""))
    },
    ".java": {
        "lang": "java",
        "run": lambda path: ["javac", path],
        "post_run": lambda path: ["java", "-cp", os.path.dirname(path), os.path.splitext(os.path.basename(path))[0]],
    },
    ".go": {
        "lang": "go",
        "run": lambda path: ["go", "run", path],
    },
    ".rs": {
        "lang": "rust",
        "run": lambda path: ["rustc", path, "-o", path.replace(".rs", "")],
        "post_run": lambda path: [path.replace(".rs", "")],
        "cleanup": lambda path: os.remove(path.replace(".rs", ""))
    }
}

class FixCodeTool(BaseTool):
    # supported languges are  i am gonna do some clean up
   
    def run(self,args:dict)->dict:
       
       path=args.get("path")

       if not path or not os.path.isfile(path):
           return {"status":"error","error":f"Invalid or missing file path: {path}"}
       
    #    detect lanaguage
       language = self.detect_language(path)

       if language == 'unknown':
           return {"status":"error","messages":"the lanauge is not supported"}
       
    #    run the code and capture the error
       error_output=self.run_code_and_capture_error(path)

       if not error_output:
           return {"status":"success","messages":"No errors found in the code"}

    # llm help here
       prompt = f"""The following {language} code at `{path}` is throwing an error.
        Please help fix it based on this error message:\n\n{error_output}\n\nOnly return the fixed code in a code block.
        f"Respond ONLY with a markdown code block like this:\n\n"
            f"```\n<your code here>\n```"
        """
       

       response=client.chat.completions.create(
                model="deepseek-chat",
                messages=[{"role":"user","content":prompt}],
                temperature=0.2
            )

       raw_output=response.choices[0].message.content.strip()
       cleaned_code=self.clean_code(raw_output)

    #    message=f"Apply suggested fix to {path} \n"
    #    reason=f""


    #    print(f"\n🔧 Suggested Fix:\n\n{cleaned_code}\n")
    #    confirm = input("Apply this fix to the file? (y/n): ").strip().lower()
    #    if confirm != "y":
    #         return {"status": "aborted", "message": "Fix not applied."}

       try:
            with open(path, "w") as f:
                f.write(cleaned_code + "\n")
            return {"status": "success", "message": "Fix applied to the file."}
       except Exception as e:
            return {"status": "error", "error": f"Failed to write fix: {str(e)}"}



    def detect_language(self,path:str)->str:
        ext_map = {
            ".py": "python",
            ".js": "javascript",
            ".ts": "typescript",
            ".cpp": "cpp",
            ".c": "c",
            ".java": "java",
            ".go": "go",
            ".rs": "rust",
        }
        _, ext = os.path.splitext(path)
        return ext_map.get(ext, "unknown")



    def clean_code(self, text: str) -> str:
    # Extract code inside triple backticks
        match = re.search(r"```(?:\w+)?\n(.*?)```", text, re.DOTALL)
        if match:
            code = match.group(1).strip()
        else:
            # Fallback: remove any stray backticks or explanation
            code = re.sub(r"```(?:\w+)?", "", text).strip("`\n ")

        # Optionally remove any '# Generated ...' lines
        lines = code.splitlines()
        clean_lines = [line for line in lines if not line.strip().startswith("# Generated")]
        return "\n".join(clean_lines)
    

    def run_code_and_capture_error(self,filepath: str) -> tuple[str, str]:
        ext = os.path.splitext(filepath)[1]
        
        if ext not in SUPPORTED_LANGUAGES:
            return "", f"❌ Unsupported file type: {ext}"

        lang_config = SUPPORTED_LANGUAGES[ext]
        lang = lang_config["lang"]
        runner = lang_config["run"]
        post_runner = lang_config.get("post_run")
        cleanup = lang_config.get("cleanup")

        try:
            # Compile or directly run
            result = subprocess.run(runner(filepath), capture_output=True, text=True, timeout=10)
            if result.returncode != 0:
                return lang, result.stderr.strip() or result.stdout.strip()
            
            # Run compiled binary if needed
            if post_runner:
                result = subprocess.run(post_runner(filepath), capture_output=True, text=True, timeout=10)
                if result.returncode != 0:
                    return lang, result.stderr.strip() or result.stdout.strip()

            return lang, ""

        except subprocess.TimeoutExpired:
            return lang, "❌ Execution timed out."
        except Exception as e:
            return lang, f"❌ Error running the code: {str(e)}"
        finally:
            if cleanup:
                try:
                    cleanup(filepath)
                except Exception:
                    pass


TOOL_REGISTRY = {
    'create_folder': createFoldertool(),
    'create_file': CreateFileTool(),
    'edit_file': EditFileTool(),
    'change_dir': ChangeDirTool(),
    'list_dir': ListDirTool(),
    'run_code': RunCodeTool(),
    'move_file': MoveFileTool(),
    'generate_code': GenerateCodeTool(),
    'fix_code':FixCodeTool(),
    "explain_code": ExplainedCodeTool()
}



def execute_tasks(tasks: list[Task]):
    current_index = 0
    while current_index < len(tasks):
        task = tasks[current_index]
        print(f"▶️ Executing Step {task.step}: {task.tool} with args {task.args}")
        task.status = 'executing'
        tool = TOOL_REGISTRY.get(task.tool)
        if not tool:
            print(f"❌ Unknown tool: {task.tool}")
            task.status = 'failed'
            break

        # temp_reason=getattr(task, 'reason')
        # print(f"temp reason is {temp_reason}")
        # task.args['reason']=getattr(task, 'reason', 'No reason provided')

        result = tool.run(task.args)
        if result['status'] == 'success':
            task.status = 'completed'
            if 'output' in result:
                print(f"   Output: {result['output']}")
            print(f"✅ Step {task.step} completed.")
            current_index += 1
        else:
            task.status = 'failed'
            print(f"❌ Step {task.step} failed: {result['error']}")
            
            # Ask LLM for a suggested fix
            fix = get_fixed_code(task, result['error'])
            if not fix:
                print("No fix provided. Stopping execution.")
                break

            # doing this wiht out confirmation mate...fuck you jossy for doing this to me
            task.args.update(fix)

            # Prompt user for confirmation before applying the fix
            # while True:
            #     user_input = input("💡 Accept suggested fix? (y/n): ").strip().lower()
            #     if user_input == 'y':
            #         task.args.update(fix)
            #         print(f"🔄 Retrying Step {task.step} after applying fix: {fix}")
            #         break  # Exit confirmation loop and retry task
            #     elif user_input == 'n':
            #         print("⛔ User rejected the fix. Stopping execution.")
            #         return
            #     else:
            #         print("Please enter 'y' or 'n'.")
           
