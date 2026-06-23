import cv2
import numpy as np
from PIL import Image

# We can do this purely with Pillow to avoid dependency issues, or use numpy.
# Since PIL is installed, let's write a robust pure-PIL/numpy bounding box finder.

img_path = "/Users/el/Desktop/dodam/jojo/sangjologo/IMG_8709.PNG"
img = Image.open(img_path).convert("RGB")
width, height = img.size

# Convert image to a numpy array or scan pixels
# A card is a solid white rectangle. Let's find rows and columns that are solid white.
# To be robust, let's scan horizontal lines to see where white rectangles are.
is_white = np.zeros((height, width), dtype=bool)
# Scan pixels
for y in range(height):
    for x in range(width):
        r, g, b = img.getpixel((x, y))
        if r == 255 and g == 255 and b == 255:
            is_white[y, x] = True

# Find bounding boxes of connected components
# Since we only want card-sized rectangles (typically ~450px width, ~240px height)
# Let's do a simple labeling
from scipy.ndimage import label, find_objects

labeled, num_features = label(is_white)
print(f"Total white components found: {num_features}")

slices = find_objects(labeled)
cards = []
for idx, sl in enumerate(slices):
    if sl is None:
        continue
    dy, dx = sl
    y_start, y_end = dy.start, dy.stop
    x_start, x_end = dx.start, dx.stop
    h = y_end - y_start
    w = x_end - x_start
    
    # Filter card size (1125x2436 resolution expected size: width 400-500, height 200-300)
    if 400 < w < 520 and 200 < h < 300:
        cards.append((x_start, y_start, w, h))

# Sort cards: top-to-bottom, then left-to-right
cards.sort(key=lambda c: (c[1] // 100, c[0]))

print("\nDetected Card Coordinates (X, Y, W, H):")
for idx, (x, y, w, h) in enumerate(cards):
    print(f"Card {idx+1}: x={x}, y={y}, w={w}, h={h}")
