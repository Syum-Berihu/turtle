import os 
from rich import print

class Tool:
    """
    This is for making tools
    """

    name:str
    description:str

    def execute(self,**kwargs)->str:
        raise NotImplementedError("Tool must implement execute() method")


class FileEditTool(Tool):
    name="file_edit"
    description=(
        "Create or overwrite a file with the given content, or append if mode='a'.\n"
        "Args:\n"
        "  path (str): filesystem path to write to.\n"
        "  content (str): content to write.\n"
        "  mode (str): file mode, 'w' to overwrite, 'a' to append. Default: 'w'."
    )


    def execute(self, path:str,content:str,mode:str="w")->str:
        try:
            os.makedirs(os.path.dirname(path),exist_ok=True)
            # print("KKKEKKREKRKERKEKREK")
            with open(path,mode,encoding="utf-8") as f:
                f.write(content)
            return f"Succefully wrote to {path}"
        except Exception as e:
            return f"Error written to '{path}':{e}"
        



