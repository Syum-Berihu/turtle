import sys
sys.path.append('../prompt_template')

from openai import OpenAI
from dotenv import load_dotenv
from rich import print
import os
import json
from prompt_template.prompt_template import PROMPT_TEMPLATE
from prompt_template.task import Task
from parse_utility import extract_json_from_code_block

load_dotenv()
deepseekapi=os.getenv("deep_seek_API")
#  os.getenv("deep_seek_API")

client=OpenAI(api_key=deepseekapi,base_url="https://api.deepseek.com")


def parse_instruction(user_instruction: str) -> list[Task]:
    full_prompt = f"{PROMPT_TEMPLATE}\n{user_instruction}"
    
    response = client.chat.completions.create(
        model="deepseek-chat", 
        messages=[{ "role": "user", "content": full_prompt }],
        temperature=0.2,
    )

    raw_output = response.choices[0].message.content.strip()
    # print("🔍 Raw LLM output:\n", raw_output)
    cleande_output=extract_json_from_code_block(raw_output)

    try:
        task_list=json.loads(cleande_output)
    except json.JSONDecodeError:
        raise ValueError("Failed to parse LLM output as JSON.")

    tasks = []
    for task_data in task_list:
        task = Task(
            step=task_data["step"],
            tool=task_data["tool"],
            args=task_data["args"]
        )
        tasks.append(task)
    
    return tasks