from openai import OpenAI
from dotenv import load_dotenv
from rich import print
import os
import re

from prompt_template.task import Task
# from model_call_parser.prompt_template.task import Task


load_dotenv()
deepseekapi=os.getenv("deep_seek_API")
#  os.getenv("deep_seek_API")

client=OpenAI(api_key=deepseekapi,base_url="https://api.deepseek.com")


def get_fixed_code(failed_task: Task, error_msg: str)->str:

    path = failed_task.args.get("path")
    if not path or not os.path.isfile(path):
        print("[yellow]No valid file path provided for fix.[/yellow]")
        return {}

    ext = os.path.splitext(path)[1]
    lang = {
        ".py": "python", ".js": "javascript", ".ts": "typescript", ".rs": "rust",
        ".java": "java", ".c": "c", ".cpp": "cpp"
    }.get(ext, "plain text")


    with open(path, "r") as f:
        original_code = f.read()


    prompt = f"""
        You are a code fixing assistant.

        You are given code written in {lang}. 

        This code has errors when running or compiling.

        Here is the original code:
        ```{lang}
        {original_code}
        ```

        Here is the error Message:

        {error_msg}


        and only output ONLY the corrected code only *no explanation* or anything like ONLY the corrected code

    """

    response=response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "user", "content": prompt}],
        stream=False,
    )

    content=response.choices[0].message.content.strip()
    # content=re.sub(r'^```','',content)
    # content = re.sub(r'```$', '', content)

    clean_content=clean_code(content)
    
    # content = re.sub(r'^```[a-zA-Z]*\n?', '', content)
    # content = re.sub(r'\n?```$', '', content)

    print(f"[blue] the fixed code is {response.choices[0].message.content.strip()}[/blue]")
    # return response.choices[0].message.content.strip()
    return {
        # "path": path,
        "content": clean_content,
        "mode": "overwrite"
    }


def clean_code(text: str) -> str:
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