import typer
from agent import process_instruction


app=typer.Typer()


@app.command()
def main(instruction:str):
    process_instruction(instruction)


if __name__=="__main__":
    app()