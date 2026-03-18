#!/usr/bin/env python3
"""
Global Git Auto-Commit Skill for OpenClaw
Works across ALL projects in the workspace

Usage:
  python3 /data/.openclaw/workspace/.openclaw/skills/git-autocommit/git_autocommit.py start
  python3 /data/.openclaw/workspace/.openclaw/skills/git-autocommit/git_autocommit.py stop
  python3 /data/.openclaw/workspace/.openclaw/skills/git-autocommit/git_autocommit.py status
"""

import os
import sys
import time
import subprocess
import json
from pathlib import Path
from datetime import datetime
from threading import Thread
import signal

PID_FILE = Path("/tmp/openclaw-git-autocommit.pid")
CONFIG_FILE = Path("/data/.openclaw/workspace/.openclaw/git-autocommit.json")
DEFAULT_CONFIG = {
    "check_interval_seconds": 30,
    "auto_push": True,
    "exclude_patterns": [".log", ".tmp", ".pyc", "__pycache__/", "node_modules/", ".git/"],
    "min_changes_for_commit": 1
}


def load_config():
    """Load user config or create default."""
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE) as f:
            return {**DEFAULT_CONFIG, **json.load(f)}
    return DEFAULT_CONFIG


def save_config(config):
    """Save user config."""
    CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)


def is_git_repo(path):
    """Check if path is a git repository."""
    return (path / ".git").exists()


def has_changes(repo_path):
    """Check if repo has uncommitted changes."""
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=repo_path, capture_output=True, text=True, timeout=5
        )
        return result.returncode == 0 and bool(result.stdout.strip())
    except:
        return False


def get_repo_name(repo_path):
    """Get repository name from git remote or folder name."""
    try:
        result = subprocess.run(
            ["git", "remote", "get-url", "origin"],
            cwd=repo_path, capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            url = result.stdout.strip()
            # Extract repo name from URL
            return url.split('/')[-1].replace('.git', '')
    except:
        pass
    return repo_path.name


def auto_commit_repo(repo_path, config):
    """Auto-commit changes in a single repo."""
    if not has_changes(repo_path):
        return False
    
    try:
        # Get changed files count
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=repo_path, capture_output=True, text=True, timeout=5
        )
        changed_files = len([l for l in result.stdout.strip().split('\n') if l.strip()])
        
        if changed_files < config["min_changes_for_commit"]:
            return False
        
        # Stage all changes
        subprocess.run(
            ["git", "add", "-A"],
            cwd=repo_path, capture_output=True, timeout=10
        )
        
        # Create commit message
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        repo_name = get_repo_name(repo_path)
        commit_msg = f"[{repo_name}] Auto-commit {changed_files} files at {timestamp}"
        
        # Commit
        result = subprocess.run(
            ["git", "commit", "-m", commit_msg],
            cwd=repo_path, capture_output=True, text=True, timeout=10
        )
        
        if result.returncode != 0:
            return False
        
        # Push if enabled
        if config["auto_push"]:
            subprocess.run(
                ["git", "push"],
                cwd=repo_path, capture_output=True, timeout=30
            )
        
        print(f"✅ {commit_msg}")
        return True
        
    except Exception as e:
        print(f"❌ Error committing {repo_path}: {e}")
        return False


def find_git_repos(base_path):
    """Find all git repositories under base_path."""
    repos = []
    try:
        for item in base_path.iterdir():
            if item.is_dir():
                if is_git_repo(item):
                    repos.append(item)
                else:
                    # Check one level deeper
                    for subitem in item.iterdir():
                        if subitem.is_dir() and is_git_repo(subitem):
                            repos.append(subitem)
    except:
        pass
    return repos


def watcher_loop():
    """Main watcher loop - runs in background."""
    config = load_config()
    workspace = Path("/data/.openclaw/workspace")
    
    print(f"🔄 Git Auto-Commit Watcher started")
    print(f"   Watching: {workspace}")
    print(f"   Interval: {config['check_interval_seconds']}s")
    print(f"   Auto-push: {config['auto_push']}")
    print(f"   Press Ctrl+C to stop\n")
    
    while True:
        try:
            # Find all git repos
            repos = find_git_repos(workspace)
            
            for repo in repos:
                auto_commit_repo(repo, config)
            
            time.sleep(config["check_interval_seconds"])
            
        except KeyboardInterrupt:
            print("\n👋 Git Auto-Commit Watcher stopped")
            break
        except Exception as e:
            print(f"❌ Watcher error: {e}")
            time.sleep(config["check_interval_seconds"])


def start_daemon():
    """Start the watcher as a background daemon."""
    if PID_FILE.exists():
        print("⚠️  Watcher already running")
        return
    
    # Fork to background
    pid = os.fork()
    if pid > 0:
        # Parent process
        PID_FILE.write_text(str(pid))
        print(f"🚀 Git Auto-Commit Watcher started (PID: {pid})")
        print(f"   Logs: tail -f /tmp/openclaw-git-autocommit.log")
        return
    
    # Child process - daemon
    os.setsid()
    sys.stdout = open('/tmp/openclaw-git-autocommit.log', 'a')
    sys.stderr = open('/tmp/openclaw-git-autocommit.log', 'a')
    watcher_loop()


def stop_daemon():
    """Stop the background watcher."""
    if not PID_FILE.exists():
        print("⚠️  Watcher not running")
        return
    
    try:
        pid = int(PID_FILE.read_text().strip())
        os.kill(pid, signal.SIGTERM)
        PID_FILE.unlink()
        print("🛑 Git Auto-Commit Watcher stopped")
    except:
        print("❌ Failed to stop watcher")


def show_status():
    """Show watcher status."""
    if PID_FILE.exists():
        try:
            pid = int(PID_FILE.read_text().strip())
            os.kill(pid, 0)  # Check if process exists
            print(f"✅ Watcher running (PID: {pid})")
            print(f"   Log: tail -f /tmp/openclaw-git-autocommit.log")
        except:
            print("⚠️  Stale PID file, watcher not running")
            PID_FILE.unlink()
    else:
        print("⏹️  Watcher not running")


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "start":
        start_daemon()
    elif command == "stop":
        stop_daemon()
    elif command == "status":
        show_status()
    elif command == "run":
        # Run in foreground (for testing)
        watcher_loop()
    else:
        print(f"Unknown command: {command}")
        print(__doc__)


if __name__ == "__main__":
    main()
