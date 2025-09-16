from typing import Dict


class Task:
    def __init__(self,step:int,tool:str,args:Dict):
        self.step=step
        self.tool=tool
        self.args=args
        self.status="pending"

    
    def __repr__(self):
        return f"<Task #{self.step}:{self.tool} {self.args} [{self.status}]>"