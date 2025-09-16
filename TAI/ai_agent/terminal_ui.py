from prompt_toolkit import prompt
from prompt_toolkit.completion import WordCompleter

def ask_user_choice():
    completer=WordCompleter(['y','n'],ignore_case=True)
    answer = prompt("[bold yellow]Apply this fix? (y/n):[/bold yellow]", completer=completer).strip().lower()
    return answer


