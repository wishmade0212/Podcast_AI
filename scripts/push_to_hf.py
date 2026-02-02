#!/usr/bin/env python3
"""
Push a local model file or folder to a Hugging Face Hub repo.

Usage:
  python scripts/push_to_hf.py --repo <owner/repo> --path <file_or_dir> --token <hf_token> [--commit-message "msg"] [--revision main]

Notes:
- Creates the repo if it doesn't exist (under your account/org) when you have permission.
- Uploads large files via LFS automatically.
- Ideal for pushing trained RVC weights (.pth) and metadata.
"""

import argparse
import os
import sys
from pathlib import Path

try:
    from huggingface_hub import HfApi, create_repo, upload_folder, upload_file
except Exception as e:
    print("Please install huggingface_hub: pip install huggingface_hub")
    raise


def push_to_hf(repo_id: str, path: Path, token: str, commit_message: str = "Add model", revision: str = "main"):
    api = HfApi(token=token)

    # Ensure repo exists (will no-op if it already exists)
    create_repo(repo_id=repo_id, token=token, exist_ok=True, repo_type="model")

    if path.is_dir():
        print(f"Uploading folder {path} to {repo_id}@{revision}...")
        upload_folder(
            repo_id=repo_id,
            folder_path=str(path),
            path_in_repo="/",
            repo_type="model",
            commit_message=commit_message,
            revision=revision,
            token=token,
        )
    else:
        print(f"Uploading file {path} to {repo_id}@{revision}...")
        upload_file(
            repo_id=repo_id,
            path_or_fileobj=str(path),
            path_in_repo=path.name,
            repo_type="model",
            commit_message=commit_message,
            revision=revision,
            token=token,
        )

    print("✅ Upload completed")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True, help="Hugging Face repo id: owner/name")
    parser.add_argument("--path", required=True, help="Path to file or directory to upload")
    parser.add_argument("--token", required=False, help="HF token (or set HF_TOKEN env var)")
    parser.add_argument("--commit-message", default="Add model", help="Commit message")
    parser.add_argument("--revision", default="main", help="Branch or tag")
    args = parser.parse_args()

    token = args.token or os.environ.get("HF_TOKEN")
    if not token:
        print("❌ Missing token. Provide --token or set env HF_TOKEN.")
        sys.exit(1)

    path = Path(args.path)
    if not path.exists():
        print(f"❌ Path not found: {path}")
        sys.exit(1)

    push_to_hf(args.repo, path, token, args.commit_message, args.revision)


if __name__ == "__main__":
    main()
