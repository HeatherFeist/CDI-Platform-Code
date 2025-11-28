# Generate PWA Icons from SVG

You can use the provided SVG to generate PNG icons needed for PWA.

## Quick Online Method:

1. Go to: https://realfavicongenerator.net/
2. Upload `pwa-icon.svg`
3. Download the generated icons
4. Place `pwa-192x192.png` and `pwa-512x512.png` in the `public/` folder

## Or use ImageMagick (if installed):

```bash
# Convert SVG to 512x512 PNG
magick convert -background none -density 300 pwa-icon.svg -resize 512x512 pwa-512x512.png

# Convert SVG to 192x192 PNG
magick convert -background none -density 300 pwa-icon.svg -resize 192x192 pwa-192x192.png
```

## Or use an online PNG converter:

1. Go to: https://cloudconvert.com/svg-to-png
2. Upload `pwa-icon.svg`
3. Set size to 512x512
4. Download and rename to `pwa-512x512.png`
5. Repeat for 192x192

## Temporary Placeholder:

For now, you can use any square image:
- Find any 512x512 PNG online
- Rename to `pwa-512x512.png`
- Copy to `pwa-192x192.png`
- Place both in `public/` folder

The app will work without icons, but they make the install experience much better!
