import os
from PIL import Image, ImageDraw, ImageChops

logo_dir = "/Users/el/Desktop/dodam/jojo/sangjologo"
output_dir = "/Users/el/Desktop/dodam/jojo/public/images/sangjo"
os.makedirs(output_dir, exist_ok=True)

# High-res screenshot filenames (PNG)
screenshots = [f"IMG_870{i}.PNG" if i < 10 else f"IMG_87{i}.PNG" for i in range(9, 18)]

# Fixed X layout coordinates for 1125x2436 resolution
x_coords = [51, 578]
card_w = 497
card_h = 234

# We will collect label crops to create a single master grid image
label_crops = []
processed_count = 0

print("Processing screenshots with left-margin vertical layout detection...")

for s_idx, filename in enumerate(screenshots):
    path = os.path.join(logo_dir, filename)
    if not os.path.exists(path):
        print(f"Skipping: {filename} (File not found)")
        continue
    
    with Image.open(path) as img:
        width, height = img.size
        img_rgb = img.convert("RGB")
        
        # --- Dynamic Y Bounding Box Detection ---
        # Scan vertical line at x=70 (inside left margin of left card)
        vertical_profile = []
        for y in range(height):
            r, g, b = img_rgb.getpixel((70, y))
            # pure white check
            is_white = (r == 255 and g == 255 and b == 255)
            vertical_profile.append(is_white)
            
        y_coords = []
        in_run = False
        start_y = 0
        for y, is_white in enumerate(vertical_profile):
            if is_white and not in_run:
                in_run = True
                start_y = y
            elif not is_white and in_run:
                in_run = False
                length = y - start_y
                # Keep components that are card-height (200px to 270px) and below search bar (Y > 500)
                if 200 < length < 270 and start_y > 500:
                    y_coords.append(start_y)
                    
        # Ensure we sort Y-coordinates from top to bottom
        y_coords.sort()
        print(f"File: {filename} | Detected {len(y_coords)} card rows at Y: {y_coords}")
        
        # We expect exactly 3 rows per screenshot. If less are detected, we fallback to default [813, 1188, 1563]
        if len(y_coords) != 3:
            print(f"  Warning: Detected {len(y_coords)} rows instead of 3. Falling back to default layout.")
            y_coords = [813, 1188, 1563]
            
        # Loop through rows (3) and cols (2)
        for r_idx, y in enumerate(y_coords):
            for c_idx, x in enumerate(x_coords):
                card_idx = r_idx * 2 + c_idx
                
                # --- Step 1: Crop the logo card (shave 18px to remove border lines completely) ---
                crop_box = (x + 18, y + 18, x + card_w - 18, y + card_h - 18)
                card_img = img_rgb.crop(crop_box)
                
                # --- Step 2: Remove star icon from the top right by painting over with white ---
                draw = ImageDraw.Draw(card_img)
                draw.rectangle([card_img.width - 90, 0, card_img.width, 75], fill=(255, 255, 255))
                
                # --- Step 3: Tight crop (remove excess white margins) ---
                bg = Image.new("RGB", card_img.size, (255, 255, 255))
                diff = ImageChops.difference(card_img, bg)
                bbox = diff.getbbox()
                if bbox:
                    logo_cropped = card_img.crop(bbox)
                else:
                    logo_cropped = card_img
                
                # --- Step 4: Fit into standardized 200x100 white background canvas ---
                canvas = Image.new("RGB", (200, 100), (255, 255, 255))
                target_w, target_h = 200, 100
                padding_x = 12
                padding_y = 8
                max_w = target_w - (padding_x * 2)
                max_h = target_h - (padding_y * 2)
                
                w, h = logo_cropped.size
                ratio = min(max_w / w, max_h / h)
                new_w = max(1, int(w * ratio))
                new_h = max(1, int(h * ratio))
                
                logo_scaled = logo_cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
                px = (target_w - new_w) // 2
                py = (target_h - new_h) // 2
                canvas.paste(logo_scaled, (px, py))
                
                # Save temp logo
                logo_temp_name = f"temp_{filename.split('.')[0]}_{card_idx}.png"
                canvas.save(os.path.join(output_dir, logo_temp_name))
                
                # --- Step 5: Crop Korean label text below the card ---
                # Label is positioned starting 8px below the card box and spans 60px height
                label_y_start = y + card_h + 8
                label_y_end = y + card_h + 68
                label_box = (x, label_y_start, x + card_w, label_y_end)
                label_img = img_rgb.crop(label_box)
                
                # Resize label to 200x24 for clean grid display
                label_resized = label_img.resize((200, 24), Image.Resampling.LANCZOS)
                label_crops.append(label_resized)
                
                processed_count += 1

print(f"Total processed logos: {processed_count}")

# Generate a master grid image of all label text crops for quick visual inspection
if label_crops:
    grid_cols = 6
    grid_rows = (len(label_crops) + grid_cols - 1) // grid_cols
    grid_w = 200 * grid_cols
    grid_h = 24 * grid_rows
    
    grid_img = Image.new("RGB", (grid_w, grid_h), (255, 255, 255))
    
    for idx, crop in enumerate(label_crops):
        col = idx % grid_cols
        row = idx // grid_cols
        grid_img.paste(crop, (col * 200, row * 24))
        
    grid_path = os.path.join(output_dir, "label_grid.png")
    grid_img.save(grid_path)
    print(f"Generated dynamic label index grid at: {grid_path}")
