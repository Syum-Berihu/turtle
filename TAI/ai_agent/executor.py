import os
import subprocess
import re
from dir_aware import  commit_git_snapshot,snapshot_backup,git_is_available
from dir_aware import save_history

# shell=os.environ.get("SHELL","/bin/sh")

def run_shell_command(command:str,instruction:str):

    if git_is_available:
        commit_git_snapshot()
    else: 
        snapshot_backup()

    if "<< 'EOF'" in command:
        match = re.search(r"cat\s*>\s*(.+?)\s*<<\s*'EOF'\n(.*?)\nEOF", command, re.DOTALL)
        if match:
            file_path = match.group(1).strip()
            file_content = match.group(2)

            # Make sure the directory exists
            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            # Write the content to the file
            with open(file_path, "w") as f:
                f.write(file_content)

            modified_command = command[:match.start()] + "true" + command[match.end():]


            return _execute_command(modified_command,instruction)
        else:
            return "","Failed to parse here-document command",1


    # this is the default command with out any shenangens
    return _execute_command(command,instruction)


def _execute_command(command:str,instruction:str):
    try:
        process=subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        stdout,stderr=process.communicate()
        save_history(instruction,command,stdout,stderr,process.returncode)
        return stdout,stderr,process.returncode
    except Exception as e:
        error_msg=f"Error executing command: {str(e)}"
        save_history(instruction,command,"",error_msg,1)
        return "",error_msg,1