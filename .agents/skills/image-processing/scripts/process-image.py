#!/usr/bin/env python3
"""Image processing with Pillow. Handles common web dev image tasks.

Usage:
    # Resize
    python3 process-image.py resize input.png --output resized.png --width 1920 --height 1080

    # Convert format (PNG→WebP, JPG→PNG with transparency, etc.)
    python3 process-image.py convert input.png --output output.webp

    # Trim whitespace (auto-crop)
    python3 process-image.py trim logo.png --output trimmed.png

    # Create thumbnail
    python3 process-image.py thumbnail input.jpg --output thumb.jpg --size 300

    # Optimise for web (resize + WebP + quality)
    python3 process-image.py optimise input.jpg --output optimised.webp --width 1200 --quality 85

    # Composite text on image (for OG cards)
    python3 process-image.py og-card --background bg.png --output og.png --title "Page Title" --subtitle "Description"

Requires: pip install Pillow (usually pre-installed)
"""

import argparse
import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
except ImportError:
    print("Pillow not installed. Run: pip install Pillow", file=sys.stderr)
    sys.exit(1)


def cmd_resize(args):
    img = Image.open(args.input)
    if args.width and args.height:
        img = img.resize((args.width, args.height), Image.LANCZOS)
    elif args.width:
        ratio = args.width / img.width
        img = img.resize((args.width, int(img.height * ratio)), Image.LANCZOS)
    elif args.height:
        ratio = args.height / img.height
        img = img.resize((int(img.width * ratio), args.height), Image.LANCZOS)
    save_image(img, args.output, args.quality)


def cmd_convert(args):
    img = Image.open(args.input)
    if args.output.lower().endswith((".jpg", ".jpeg")) and img.mode == "RGBA":
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3])
        img = bg
    save_image(img, args.output, args.quality)


def cmd_trim(args):
    img = Image.open(args.input)
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    # Use alpha channel or detect background colour from corners
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    save_image(img, args.output, args.quality)


def cmd_thumbnail(args):
    img = Image.open(args.input)
    size = args.size or 300
    img.thumbnail((size, size), Image.LANCZOS)
    save_image(img, args.output, args.quality)


def cmd_optimise(args):
    img = Image.open(args.input)
    if args.width:
        ratio = args.width / img.width
        img = img.resize((args.width, int(img.height * ratio)), Image.LANCZOS)
    save_image(img, args.output, args.quality or 85)


def cmd_og_card(args):
    width, height = 1200, 630
    if args.background:
        img = Image.open(args.background).resize((width, height), Image.LANCZOS)
    else:
        img = Image.new("RGB", (width, height), args.bg_color or "#1a1a2e")

    # Semi-transparent overlay for text readability
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 128))
    img = img.convert("RGBA")
    img = Image.alpha_composite(img, overlay)

    draw = ImageDraw.Draw(img)

    # Try to find a good font, fall back to default
    font_title = _get_font(48)
    font_sub = _get_font(24)

    # Title
    if args.title:
        bbox = draw.textbbox((0, 0), args.title, font=font_title)
        tw = bbox[2] - bbox[0]
        x = (width - tw) // 2
        draw.text((x, height // 2 - 60), args.title, fill="white", font=font_title)

    # Subtitle
    if args.subtitle:
        bbox = draw.textbbox((0, 0), args.subtitle, font=font_sub)
        tw = bbox[2] - bbox[0]
        x = (width - tw) // 2
        draw.text((x, height // 2 + 20), args.subtitle, fill="#cccccc", font=font_sub)

    img = img.convert("RGB")
    save_image(img, args.output, args.quality)


def _get_font(size):
    """Try system fonts, fall back to Pillow default."""
    font_paths = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSText.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def save_image(img, output, quality=None):
    os.makedirs(os.path.dirname(output) or ".", exist_ok=True)
    kwargs = {}
    ext = output.lower().rsplit(".", 1)[-1]
    if ext == "webp":
        kwargs = {"quality": quality or 85, "method": 6}
    elif ext in ("jpg", "jpeg"):
        kwargs = {"quality": quality or 90, "optimize": True}
        if img.mode == "RGBA":
            bg = Image.new("RGB", img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[3])
            img = bg
    elif ext == "png":
        kwargs = {"optimize": True}

    img.save(output, **kwargs)
    size = os.path.getsize(output)
    print(f"Saved {output} ({img.width}x{img.height}, {size:,} bytes)")


def main():
    parser = argparse.ArgumentParser(description="Image processing for web development")
    sub = parser.add_subparsers(dest="command", required=True)

    # Shared args
    def add_common(p):
        p.add_argument("--output", "-o", required=True, help="Output file path")
        p.add_argument("--quality", "-q", type=int, help="Output quality (1-100)")

    # resize
    p = sub.add_parser("resize", help="Resize image")
    p.add_argument("input", help="Input file")
    p.add_argument("--width", "-w", type=int)
    p.add_argument("--height", type=int)
    add_common(p)

    # convert
    p = sub.add_parser("convert", help="Convert format")
    p.add_argument("input", help="Input file")
    add_common(p)

    # trim
    p = sub.add_parser("trim", help="Auto-crop whitespace")
    p.add_argument("input", help="Input file")
    add_common(p)

    # thumbnail
    p = sub.add_parser("thumbnail", help="Create thumbnail")
    p.add_argument("input", help="Input file")
    p.add_argument("--size", "-s", type=int, default=300, help="Max dimension")
    add_common(p)

    # optimise
    p = sub.add_parser("optimise", help="Optimise for web")
    p.add_argument("input", help="Input file")
    p.add_argument("--width", "-w", type=int, help="Max width (maintains aspect)")
    add_common(p)

    # og-card
    p = sub.add_parser("og-card", help="Generate OG card image")
    p.add_argument("--background", help="Background image (optional)")
    p.add_argument("--bg-color", default="#1a1a2e", help="Background colour if no image")
    p.add_argument("--title", required=True, help="Card title")
    p.add_argument("--subtitle", help="Card subtitle")
    add_common(p)

    args = parser.parse_args()
    commands = {
        "resize": cmd_resize, "convert": cmd_convert, "trim": cmd_trim,
        "thumbnail": cmd_thumbnail, "optimise": cmd_optimise, "og-card": cmd_og_card,
    }
    commands[args.command](args)


if __name__ == "__main__":
    main()
