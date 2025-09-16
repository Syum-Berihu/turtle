# AgentForTerminal

AgentForTerminal is a Python-based terminal assistant that interprets user instructions, executes shell commands, and even fixes code errors using built-in language models. It integrates with Git for snapshot commits and supports dry-run checks for safety.

## Features

- **Interactive CLI:** Uses [Typer](https://typer.tiangolo.com) (see [ai_agent/main.py](ai_agent/main.py)) for command-line operations.
- **LLM Integration:** Generates commands and fixes code using an OpenAI-based client in [ai_agent/llm.py](ai_agent/llm.py).
- **Auto Debugging:** Reads, fixes, and executes code files (e.g., fixes errors in [ai_agent/buggy.py](ai_agent/buggy.py)) with automatic diff comparisons.
- **Terminal UI:** Visual prompts and confirmations with [prompt_toolkit](https://python-prompt-toolkit.readthedocs.io) in [ai_agent/terminal_ui.py](ai_agent/terminal_ui.py).
- **File Operations:** Basic file operations and backups are handled in [ai_agent/file_ops.py](ai_agent/file_ops.py).
- **Shell Command Execution:** Executes commands with history tracking and manages snapshots via [ai_agent/executor.py](ai_agent/executor.py) and [ai_agent/dir_aware.py](ai_agent/dir_aware.py).
- **Multi-language Support:** Supports code execution for languages like Python, JavaScript, Rust, TypeScript, Java, C, and C++.

## Upcoming Features

- **Code Editing Plugin:** Integration of an advanced in-editor code editing plugin that enhances code completion, syntax highlighting, and inline error detection.
- **Web Browsing Plugin:** A built-in web browsing tool to quickly search for documentation, code snippets, and online resources without leaving the terminal interface.


## Project Structure

- **Root Files:**
  - `.gitignore` – Specifies ignored files and directories.
  - `README.md` – This file.
- **ai_agent Directory:**
  - `main.py` – Entry point for processing instructions.
  - `agent.py` – Processes instructions and orchestrates command execution.
  - `llm.py` – Contains functions to interact with the language model.
  - `file_ops.py` – Provides file reading, writing, and backup operations.
  - `executor.py` – Responsible for executing shell commands.
  - `dir_aware.py` – Handles directory snapshots, Git commits, and history.
  - `terminal_ui.py` – Provides an interactive terminal UI.
  - `buggy.py` – Sample file with an error used for debugging demonstrations.
  - `cool_script.py` – Example script that generates colorful ASCII art.
  - `cool_script.py.bak` – Backup version of the cool script.
  - `agent_history.json` – Log file containing a history of executed instructions.
- **rust_tools Directory:**
  - Contains tools and resources for Rust-related tasks.

## Getting Started

1. **Install Dependencies:**  
   Make sure you have Python installed. Then install required packages:
   ```sh
   pip install typer prompt_toolkit rich python-dotenv openai
   ```
