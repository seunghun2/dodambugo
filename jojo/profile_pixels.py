from PIL import Image
import os

img_path = "/Users/el/Desktop/dodam/jojo/sangjologo/IMG_8709.PNG"
if not os.path.exists(img_path):
    print("Test file not found")
    exit()

img = Image.open(img_path)
width, height = img.size
print(f"Loaded image size: {width}x{height}")

# Profile vertically at x = 250 (which should pass through the left-hand column cards)
vertical_profile = []
for y in range(height):
    r, g, b = img.getpixel((250, y))[:3]
    # Check if pixel is pure white (within card)
    is_white = (r == 255 and g == 255 and b == 255)
    vertical_profile.append((y, is_white))

# Group consecutive white pixel runs
runs = []
in_run = False
start_y = 0
for y, is_white in vertical_profile:
    if is_white and not in_run:
        in_run = True
        start_y = y
    elif not is_white and in_run:
        in_run = False
        length = y - start_y
        if length > 50:  # Skip tiny white spots, cards should be taller than 50px
            runs.append((start_y, y - 1, length))

print("\nDetected card vertical runs (y-coordinates):")
for idx, run in enumerate(runs):
    print(f"Card Row {idx+1}: Start Y = {run[0]}, End Y = {run[1]}, Height = {run[2]}px")

if len(runs) > 0:
    # Pick the middle y-coord of the first card row to scan horizontally
    test_y = (runs[0][0] + runs[0][1]) // 2
    horizontal_profile = []
    for x in range(width):
        r, g, b = img.getpixel((x, test_y))[:3]
        is_white = (r == 255 and g == 255 and b == 255)
        horizontal_profile.append((x, is_white))

    x_runs = []
    in_x_run = False
    start_x = 0
    for x, is_white in horizontal_profile:
        if is_white and not in_x_run:
            in_x_run = True
            start_x = x
        elif not is_white and in_x_run:
            in_x_run = False
            length = x - start_x
            if length > 100:  # Skip thin lines
                x_runs.append((start_x, x - 1, length))

    print("\nDetected card horizontal runs (x-coordinates):")
    for idx, run in enumerate(x_runs):
        print(f"Card Col {idx+1}: Start X = {run[0]}, End X = {run[1]}, Width = {run[2]}px")
