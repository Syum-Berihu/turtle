from openai import OpenAI
from dotenv import load_dotenv
from dir_aware import generate_prompt_context
from rich import print
import os

load_dotenv()
deepseekapi=os.getenv("deep_seek_API")
#  os.getenv("deep_seek_API")

client=OpenAI(api_key=deepseekapi,base_url="https://api.deepseek.com")



def get_command_from_instruction(instruction: str) -> str:
    prompt = f"""
    You are a terminal AI agent. Break tasks into steps. Output only structured format:
    - Use "command -----" for shell commands
    - Use "code [filename]" for file writing
    - No extra explanations. Just steps.

    Example:
    command -----
    ls -l
    code example.py -----
    print("Hello")

    Your task: {instruction}
    """
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "user", "content": prompt}],
        stream=False,
    )
    return response.choices[0].message.content.strip()


def get_fixed_command(instruction:str,bad_command:str,error_message:str)->str:
    prompt = f"""
        You are an AI terminal assistant. A user gave the instruction:

        "{instruction}"

        You tried running this command, but it failed:

        {bad_command}

        Here is the error:
        {error_message}

        Give ONLY a corrected command that should work instead.
        Do not include any explanation or commentary — just output the new bash command.
    """

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "user", "content": prompt}],
        stream=False,
    )
    print(f"[blue] the fixed code is {response.choices[0].message.content.strip()}[/blue]")
    return response.choices[0].message.content.strip()


def get_fixed_code(original_code:str,error_message:str,language:str)->str:
    prompt = f"""
        You are a code fixing assistant.

        You are given code written in {language}. 

        This code has errors when running or compiling.

        Here is the original code:
        ```{language}
        {original_code}
        ```

        Here is the error Message:

        {error_message}


        and only output ONLY the corrected code only *no explanation* or anything like ONLY the corrected code

    """

    response=response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "user", "content": prompt}],
        stream=False,
    )
    print(f"[blue] the fixed code is {response.choices[0].message.content.strip()}[/blue]")
    return response.choices[0].message.content.strip()