import os
import subprocess
import re
from PIL import Image

logo_dir = "/Users/el/Desktop/dodam/jojo/sangjologo"
output_dir = "/Users/el/Desktop/dodam/jojo/public/images/sangjo"
ocr_swift = "/Users/el/.gemini/antigravity/brain/138fdf56-14b0-44e6-ac98-f17d84055273/scratch/ocr.swift"

screenshots = [f"IMG_870{i}.PNG" if i < 10 else f"IMG_87{i}.PNG" for i in range(9, 18)]
x_coords = [51, 578]
card_w = 497
card_h = 234

# OCR 텍스트 정제 딕셔너리 (인식 오류 보정)
corrections = {
    "에이치디트어조": "에이치디투어즈",
    "에이치디트어즈": "에이치디투어즈",
    "우리제주조": "우리제주상조",
    "차라사지": "한라상조",
    "지우라이프삭조": "지우라이프상조",
    "좋은세삭": "좋은세상",
    "제주일출조": "제주임출상조",
    "제주정례협동": "제주장례협동조합",
    "우리과곽": "우리관광",
    "씨케이티피에스라이프": "CKTPS라이프",
    "지우라이프상조": "지우라이프상조",
    "산림조합라이프": "산림조합라이프",
    "아름라이프상조": "아름라이프상조"
}

# 이름 클리닝 함수
def clean_name(name):
    # 특수문자 제거, 공백 제거
    name = re.sub(r"[^\w\s\(\)]", "", name)
    name = name.strip().replace(" ", "")
    # 보정 테이블 적용
    for err, corr in corrections.items():
        if err in name:
            return corr
    return name

print("Starting automatic renaming using OCR...")

# 임시 라벨 이미지 경로
temp_label_path = "/Users/el/Desktop/dodam/jojo/public/images/sangjo/temp_label.png"

for filename in screenshots:
    path = os.path.join(logo_dir, filename)
    if not os.path.exists(path):
        continue
    
    with Image.open(path) as img:
        width, height = img.size
        img_rgb = img.convert("RGB")
        
        # Y좌표 감지 (process_logos.py와 동일)
        vertical_profile = []
        for y in range(height):
            r, g, b = img_rgb.getpixel((70, y))
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
                if 200 < length < 270 and start_y > 500:
                    y_coords.append(start_y)
                    
        y_coords.sort()
        if len(y_coords) != 3:
            y_coords = [813, 1188, 1563]
            
        for r_idx, y in enumerate(y_coords):
            for c_idx, x in enumerate(x_coords):
                card_idx = r_idx * 2 + c_idx
                logo_temp_name = f"temp_{filename.split('.')[0]}_{card_idx}.png"
                logo_temp_path = os.path.join(output_dir, logo_temp_name)
                
                if not os.path.exists(logo_temp_path):
                    continue
                
                # 라벨 크롭 및 임시 저장
                label_y_start = y + card_h + 8
                label_y_end = y + card_h + 68
                label_box = (x, label_y_start, x + card_w, label_y_end)
                label_img = img_rgb.crop(label_box)
                label_img.save(temp_label_path)
                
                # Swift OCR 실행
                try:
                    cmd = ["swift", ocr_swift, temp_label_path]
                    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
                    output_lines = result.stdout.strip().split("\n")
                    
                    # OCR 텍스트 중 실제 인식된 텍스트 후보 추출
                    text_candidates = []
                    for line in output_lines:
                        line = line.strip()
                        if not line:
                            continue
                        if "Starting OCR request" in line or "OCR Completed" in line or "Found" in line:
                            continue
                        text_candidates.append(line)
                    
                    if text_candidates:
                        raw_name = text_candidates[0]
                        cleaned = clean_name(raw_name)
                        
                        # 만약 텍스트가 의미없는 노이즈면 스킵
                        if len(cleaned) <= 1 or cleaned.replace(".", "").strip() == "" or cleaned.startswith(".."):
                            print(f"Skipped noise name: '{raw_name}' from {logo_temp_name}")
                            continue
                            
                        # 최종 파일명으로 리네임
                        final_filename = f"{cleaned}.png"
                        final_path = os.path.join(output_dir, final_filename)
                        
                        # 이미 존재하는 파일인 경우 중복 처리
                        if os.path.exists(final_path):
                            print(f"File already exists: {final_filename} (Replacing)")
                            os.remove(final_path)
                        
                        os.rename(logo_temp_path, final_path)
                        print(f"Renamed: {logo_temp_name} -> {final_filename} (Raw: {raw_name})")
                    else:
                        print(f"Could not extract text for {logo_temp_name}")
                except Exception as e:
                    print(f"Error processing {logo_temp_name}: {e}")

# 임시 파일 정리
if os.path.exists(temp_label_path):
    os.remove(temp_label_path)

# 아직 리네임되지 않은 temp_*.png 파일 목록 삭제 (중복이거나 잘림 등으로 불완전한 로고들 정리)
for file in os.listdir(output_dir):
    if file.startswith("temp_") and file.endswith(".png"):
        try:
            os.remove(os.path.join(output_dir, file))
        except:
            pass

print("OCR Renaming process completed.")
