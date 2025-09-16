import re

def extract_json_from_code_block(text: str) -> str:
    if "```json" in text:
        text = text.split("```json", 1)[-1]
    elif "```" in text:
        text = text.split("```", 1)[-1]
    return text.strip("` \n")

