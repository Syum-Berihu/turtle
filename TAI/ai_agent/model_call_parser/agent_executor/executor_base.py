from abc import ABC,abstractmethod
from prompt_toolkit import prompt
from prompt_toolkit.completion import WordCompleter

class BaseTool(ABC):
    @abstractmethod
    def run(self,args:dict)->dict:
        pass

    # def confirm_action(self,message:str,reason:str)->bool:
    #     full_message=f"{message}"

    #     if reason:
    #         full_message += f"\nReason: {reason}"

    #     completer=WordCompleter(['y', 'n'], ignore_case=True)
    #     answer = prompt(f"[bold yellow]{full_message} (y/n):[/bold yellow] ", completer=completer).strip().lower()
    #     return answer == 'y'