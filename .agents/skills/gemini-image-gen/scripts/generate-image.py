#!/usr/bin/env python3
"""Generate images via Gemini API. No dependencies beyond Python 3 stdlib.

Usage:
    # Text-to-image
    python3 generate-image.py --prompt "A warm hero background for a spa website" --output hero.png

    # With style reference image
    python3 generate-image.py --prompt "Same style, different subject" --reference ref.jpg --output out.png

    # Multiple variants
    python3 generate-image.py --prompt "..." --output variant.png --count 3

    # Use pro model for final assets
    python3 generate-image.py --prompt "..." --output final.png --model gemini-3-pro-image-preview

Reads GEMINI_API_KEY from environment.
"""

import argparse
import base64
import json
import os
import sys
import urllib.request
import urllib.error


def generate(model: str, prompt: str, api_key: str, reference_path: str = None) -> bytes:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    parts = []

    if reference_path:
        with open(reference_path, "rb") as f:
            img_data = base64.b64encode(f.read()).decode()
        ext = reference_path.rsplit(".", 1)[-1].lower()
        mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(ext, "image/jpeg")
        parts.append({"inlineData": {"mimeType": mime, "data": img_data}})

    parts.append({"text": prompt})

    payload = json.dumps({
        "contents": [{"parts": parts}],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
            "temperature": 0.7 if reference_path else 1.0,
        },
    }).encode()

    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        print(f"Gemini API error {e.code}: {body}", file=sys.stderr)
        sys.exit(1)

    # Extract image from response
    try:
        for candidate in data.get("candidates", []):
            for part in candidate.get("content", {}).get("parts", []):
                if "inlineData" in part:
                    return base64.b64decode(part["inlineData"]["data"])
    except (KeyError, IndexError):
        pass

    # No image in response — print text response for debugging
    try:
        text = data["candidates"][0]["content"]["parts"][0].get("text", "")
        if text:
            print(f"Gemini returned text instead of image: {text}", file=sys.stderr)
    except (KeyError, IndexError):
        print(f"Unexpected response: {json.dumps(data, indent=2)[:500]}", file=sys.stderr)
    sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Generate images via Gemini API")
    parser.add_argument("--prompt", required=True, help="Image generation prompt")
    parser.add_argument("--output", required=True, help="Output file path (e.g. hero.png)")
    parser.add_argument("--model", default="gemini-2.5-flash-image", help="Gemini model ID")
    parser.add_argument("--reference", help="Reference image for style matching")
    parser.add_argument("--count", type=int, default=1, help="Number of variants to generate")
    args = parser.parse_args()

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not set. Get a key from https://aistudio.google.com/apikey", file=sys.stderr)
        sys.exit(1)

    for i in range(args.count):
        if args.count > 1:
            base, ext = args.output.rsplit(".", 1)
            output_path = f"{base}-{i+1}.{ext}"
        else:
            output_path = args.output

        print(f"Generating {output_path}...", file=sys.stderr)
        img_bytes = generate(args.model, args.prompt, api_key, args.reference)

        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(img_bytes)
        print(f"Saved {output_path} ({len(img_bytes):,} bytes)", file=sys.stderr)


if __name__ == "__main__":
    main()
