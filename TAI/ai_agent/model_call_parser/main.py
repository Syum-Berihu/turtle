from parser import parse_instruction
from rich import print
import typer

# from model_call_parser.agents_execs import execute_tasks

import sys
import os



sys.path.append("/home/nebiyu/Documents/github_repos/TAI/ai_agent/model_call_parser/agent-executor")
from agent_executor.agents_execs import execute_tasks


app=typer.Typer()


@app.command()
def main(instruction:str):
    print(f"Parsing instruction: {instruction}")
    tasks=parse_instruction(instruction)
    print(f"Parsed {len(tasks)}")

    for task in tasks:
        print(task)
    print(f"[bold green]Executing tasks [/bold green]")
    execute_tasks(tasks)

if __name__=="__main__":
    app()