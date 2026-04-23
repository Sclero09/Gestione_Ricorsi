from PIL import Image
import os

img_path = r'C:\Users\franc\.gemini\antigravity\brain\1be8281e-e875-485c-890a-31462074f3c5\legal_scale_icon_1776943353566.png'
ico_path = 'app_icon.ico'

if os.path.exists(img_path):
    img = Image.open(img_path)
    # Icon sizes for Windows
    icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save(ico_path, sizes=icon_sizes)
    print(f"Icon saved successfully at {ico_path}")
else:
    print(f"Error: Image not found at {img_path}")
