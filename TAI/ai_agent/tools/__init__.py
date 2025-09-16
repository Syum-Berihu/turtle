from .main_tools import FileEditTool


TOOl_REGISTERY={
    FileEditTool.name:FileEditTool()
}

def use_tool(tool_name:str,**kwargs):
    tool=TOOl_REGISTERY.get(tool_name)
    if not tool:
        return f"Tool {tool_name} not found"
    return tool.execute(**kwargs)