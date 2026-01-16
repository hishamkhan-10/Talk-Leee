This folder should contain generated PNG icon fallbacks for various platforms.
Recommended files:
- favicon-32x32.png
- icon-192.png
- icon-512.png
- apple-touch-icon.png

To generate them locally from `public/favicon.svg`, use ImageMagick or sharp:

ImageMagick (Windows / PowerShell):
magick convert public/favicon.svg -resize 32x32 public/icons/favicon-32x32.png
magick convert public/favicon.svg -resize 192x192 public/icons/icon-192.png
magick convert public/favicon.svg -resize 512x512 public/icons/icon-512.png
magick convert public/favicon.svg -resize 180x180 public/icons/apple-touch-icon.png

sharp (node):
# install sharp globally or use npx
npx sharp public/favicon.svg -resize 32 32 public/icons/favicon-32x32.png
npx sharp public/favicon.svg -resize 192 192 public/icons/icon-192.png
npx sharp public/favicon.svg -resize 512 512 public/icons/icon-512.png
npx sharp public/favicon.svg -resize 180 180 public/icons/apple-touch-icon.png

After generating, restart the dev server and hard-refresh your browser.
