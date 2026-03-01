# Gemini Image Prompting Guide

## The 5-Part Prompt Framework

Build prompts using these five components in order:

### 1. Scene Setup
What's in the image — subject, setting, composition.

```
"A woman receiving a facial treatment in a luxury day spa"
"A modern office workspace with plants and warm lighting"
"An aerial view of a coastal town at sunset"
```

### 2. Camera & Lens
Concrete photography parameters control the look more reliably than adjectives.

| Parameter | Effect | Example |
|-----------|--------|---------|
| Focal length | Compression/perspective | "85mm" (portrait), "24mm" (wide), "135mm" (compressed) |
| Aperture | Depth of field | "f/1.8" (blurry bg), "f/8" (sharp throughout) |
| Angle | Perspective | "eye level", "overhead flat lay", "low angle looking up" |
| Distance | Framing | "close-up", "medium shot", "wide establishing shot" |

```
"Shot at 85mm f/1.8, shallow depth of field, medium shot from eye level"
```

### 3. Lighting
Describe the light source, quality, and colour temperature.

| Instead of... | Use... |
|---------------|--------|
| "beautiful lighting" | "warm golden-hour light from the left, 4500K" |
| "professional lighting" | "soft diffused window light, slight rim light from behind" |
| "moody lighting" | "low-key dramatic side lighting, deep shadows, single source" |

```
"Warm directional light from a large window on the right, soft shadows, 4000K colour temperature"
```

### 4. Colour Palette
Anchor to specific colours from the project. Use hex codes or descriptive anchors.

```
"Warm terracotta (#C66A52) and cream (#F5F0EB) tones throughout"
"Cool slate blue and white palette, desaturated"
"Rich emerald green and gold accents"
```

**Pull from the project**: check `input.css`, `tailwind.config`, or the colour-palette skill output for exact values.

### 5. Negative Constraints
What to exclude. Always include these:

```
"No text, no watermarks, no logos, no hands, no fingers"
```

Add context-specific negatives:

```
"No people" (for abstract backgrounds)
"No artificial elements" (for nature shots)
"No cluttered background" (for product shots)
```

## Complete Example

```
A woman receiving a gentle facial treatment in a luxury day spa,
warm golden-hour light streaming through sheer curtains from the left,
shot at 85mm f/2.0 with shallow depth of field,
warm terracotta and cream colour palette,
soft bokeh in the background showing spa interior,
photorealistic, natural skin texture,
no text, no watermarks, no logos, no hands visible
```

## Style Matching with Reference Images

When using `--reference` to match an existing image's style:

1. **Be specific about what to change** (subject, framing, setting)
2. **Let the model infer what to keep** (lighting, colour palette, mood)
3. **Lower temperature** (0.7) stays closer to the reference

```
"Using the same warm lighting, colour palette, and photographic style as the reference image,
generate a close-up of hands performing a massage treatment on a spa table.
Maintain the same soft-focus background treatment and golden tones."
```

## Common Failure Modes

| Issue | Fix |
|-------|-----|
| Text appears in image | Add "no text, no words, no letters" explicitly |
| Hands look wrong | Add "no hands, no fingers" or crop hands out |
| Too generic/stock-photo | Add specific camera specs and colour anchors |
| Inconsistent style across variants | Use `--reference` with the best variant as input |
| Image has watermark-like patterns | Add "clean image, no watermarks, no artifacts" |

## Web Asset Dimensions

| Use case | Dimensions | Aspect Ratio |
|----------|-----------|--------------|
| Hero banner | 1920x1080 | 16:9 |
| OG / social card | 1200x630 | ~1.9:1 |
| Square thumbnail | 1024x1024 | 1:1 |
| Blog header | 1200x675 | 16:9 |
| Product photo | 1024x1024 | 1:1 |
| Texture/pattern tile | 512x512 | 1:1 |
