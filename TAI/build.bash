
mkdir -p ../bin
cd ai_agent && uv run python -m nuitka --standalone --output-dir=../../src-tauri/bin --output-filename=agent --onefile ./model_call_parser/main.py
