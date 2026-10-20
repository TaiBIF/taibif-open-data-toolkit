# README Hero Banner

The banner uses the actual screenshots in `docs/images/`, with editable HTML/CSS typography, a light dotted background, and three stacked, skewed panels.

- Source: [hero.html](hero.html)
- Export: [hero.png](../images/hero.png)
- Canvas: 1680 × 840 CSS pixels
- PNG: 3360 × 1680 pixels (2× resolution)

Open `hero.html` in a browser to preview it. Edit its text and styles directly; the screenshot references remain relative to this directory. The CSS crops the screenshot margins without modifying the original files. The source uses local system fonts and makes no external network requests.

## Export on macOS

From the repository root, run the following with Google Chrome installed:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless \
  --disable-gpu \
  --no-first-run \
  --no-default-browser-check \
  --user-data-dir=/tmp/taibif-hero-chrome \
  --hide-scrollbars \
  --force-device-scale-factor=2 \
  --window-size=1680,840 \
  --screenshot="$PWD/docs/images/hero.png" \
  "file://$PWD/docs/hero/hero.html"
```

The banner is a static PNG so README viewers do not need HTML/CSS transform support. Typography can vary when exporting on a system with different fonts.
