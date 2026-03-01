#!/usr/bin/env python3
"""Call Gemini API for peer review. No CLI dependencies — just urllib.

Usage:
    python3 gemini-review.py --model gemini-2.5-flash --prompt-file /tmp/prompt.txt
    python3 gemini-review.py --model gemini-2.5-pro --prompt "Review this code..."

Reads GEMINI_API_KEY from environment. Exit 1 on error with message to stderr.
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error


def call_gemini(model: str, prompt: str, api_key: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 8192,
        },
    }).encode()

    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        print(f"Gemini API error {e.code}: {body}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"Network error: {e.reason}", file=sys.stderr)
        sys.exit(1)

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        print(f"Unexpected response structure: {json.dumps(data, indent=2)}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Call Gemini API for peer review")
    parser.add_argument("--model", default="gemini-2.5-flash", help="Gemini model ID")
    parser.add_argument("--prompt", help="Prompt text (inline)")
    parser.add_argument("--prompt-file", help="Path to file containing the prompt")
    args = parser.parse_args()

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not set. Get a key from https://aistudio.google.com/apikey", file=sys.stderr)
        sys.exit(1)

    if args.prompt_file:
        with open(args.prompt_file) as f:
            prompt = f.read()
    elif args.prompt:
        prompt = args.prompt
    else:
        print("Provide --prompt or --prompt-file", file=sys.stderr)
        sys.exit(1)

    result = call_gemini(args.model, prompt, api_key)
    print(result)


if __name__ == "__main__":
    main()
