import subprocess
import os
import shutil
import sys
from colorama import init, Fore, Style

init(autoreset=True)

def fancy_print(msg, color=Fore.WHITE, symbol="•"):
    print(f"{color}{symbol} {msg}{Style.RESET_ALL}")

def run_command(command, success_msg, error_msg):
    fancy_print(f"Running: {command}", Fore.CYAN, "🚀")
    result = subprocess.run(command, shell=True)
    if result.returncode == 0:
        fancy_print(success_msg, Fore.GREEN, "✅")
        return True
    else:
        fancy_print(error_msg, Fore.RED, "❌")
        sys.exit(1)

fancy_print("✨ Starting clean build process... ✨", Fore.MAGENTA, "🌟")

# 0. Clean old build folders
CLEAN_FOLDERS = ["backend", "dist", "release", "build"]

for folder in CLEAN_FOLDERS:
    if os.path.exists(folder):
        try:
            shutil.rmtree(folder)
            fancy_print(f"Deleted old folder: {folder}", Fore.YELLOW, "🗑️")
        except Exception as e:
            fancy_print(f"Error deleting {folder}: {e}", Fore.RED, "❌")
            sys.exit(1)
    else:
        fancy_print(f"Folder not found (skipped): {folder}", Fore.CYAN, "ℹ️")

# 1. Build backend.exe using PyInstaller
run_command(
    "pyinstaller --onefile run.py --name backend --paths .",
    "backend.exe built successfully.",
    "Error: PyInstaller failed to build backend.exe."
)

# 2. Create backend folder if it doesn't exist and copy backend.exe
fancy_print("Creating 'backend' directory and copying backend.exe...", Fore.YELLOW, "📁")
os.makedirs("backend", exist_ok=True)
try:
    shutil.copy("dist/backend.exe", "backend/backend.exe")
    fancy_print("backend.exe copied to 'backend/' directory.", Fore.GREEN, "✅")
except Exception as e:
    fancy_print(f"Error: Failed to copy backend.exe. {e}", Fore.RED, "❌")
    sys.exit(1)

# 3. Run npm run build for the Electron application
run_command(
    "npm run build",
    "Electron application built successfully.\n🎉 Build process completed! 🎉",
    "Error: npm run build failed for the Electron application."
)
