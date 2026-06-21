import os
from PIL import Image

logo_dir = "/Users/el/Desktop/dodam/jojo/sangjologo"
files = [f for f in os.listdir(logo_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]

print(f"Total image files found: {len(files)}")
for f in sorted(files):
    path = os.path.join(logo_dir, f)
    with Image.open(path) as img:
        print(f"File: {f} | Format: {img.format} | Size: {img.size} | Mode: {img.mode}")
