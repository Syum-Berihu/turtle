import os
import subprocess
import shutil
import json

from datetime import datetime
from pathlib import Path

shell=os.environ.get("SHELL","/bin/bash")
history_file="agent_history.json"
back_dir=".agent_backups"

if not os.path.exists(history_file):
    with open(history_file,"w") as f:
        json.dump([],f)

os.makedirs(back_dir,exist_ok=True)

def get_directory_state(root_dir='.')->str:
    result=subprocess.run(["tree","-L","2"],capture_output=True,text=True)
    return result.stdout.strip()


def snapshot_backup()->str:
    timestamp=datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path=Path(back_dir) / f"snapshot_{timestamp}"
    shutil.copytree(".",backup_path,ignore=shutil.ignore_patterns(back_dir,".git","__pycache__"))
    return str(backup_path)

def git_is_available()->bool:
    return subprocess.call(["git","status"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)==0

def commit_git_snapshot():
    subprocess.run(["git","add","-A"])
    timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    subprocess.run(["git","commit","-m",f"Agent snapshot at {timestamp}"])


def save_history(instruction:str,command:str,stdout:str,stderr:str,returncode:int):
    with open(history_file,"r") as f:
        history=json.load(f)
    
    history.append({
        "timestamp":datetime.now().isoformat(),
        "instruction":instruction,
        "command":command,
        "stdout":stdout,
        "stderr":stderr,
        "returncode":returncode
    })

    with open(history_file,"w") as f:
        json.dump(history,f,indent=2)

def summerize_history(history_path="agent_history.json",limit=5):
    if not os.path.exists(history_path):
        return "No History yet"

    with open(history_path,"r") as f:
        try:
            history=json.load(f)

        except json.JSONDecodeError:
            return "History is unreadable"
    
    if not history:
        return "History is empty"
    
    recent=history[-limit:]
    summary="\n".join(f"{i+1},{entry['instruction']}" for i,entry in enumerate(recent))
    return f"Recent instruction:\n{summary}"

def generate_prompt_context():
    dir_state=get_directory_state()
    cwd=os.getcwd()
    history_summary=summerize_history()
    return f"""
            current directory state:  {cwd}
            Files & Folders:{dir_state}
            
            Recent Activity: {history_summary}

    """


# def dry_run_check(command:str)->str:
#     if "mkdir" in command:
#         directory=command.split(" ")[1]
#         if os.path.exists(directory):
#             return f"Dry run: Directory '{directory}' already exists."
#         else:
#             return f"Dry run Directory $`{directory}` will be created."
    
#     elif "cat" in command:
#         parts = command.strip().split()
#         if len(parts) >= 2:
#             filename = parts[1]
#             if os.path.exists(filename):
#                 return f"Dry run: File `{filename}` already exists"
#             else:
#                 return f"Dry run: File `{filename}` will be read (may not exist)"
#         else:
#             return "Dry run: 'cat' command missing filename."
        
#     elif command.startswith("python") or command.startswith("python3"):
#         parts = command.split(" ")
#         if len(parts) > 1:
#             filename = parts[1]
#             if os.path.exists(filename):
#                 return f"Dry run: Python file `{filename}` will be executed."
#             else:
#                 return f"Dry run: Python file `{filename}` does not exist"
#         else:
#             return "Dry run: No filename specified for python execution."
        
#     return f"Dry run:command :'{command}' not recognized for dry run simulation"