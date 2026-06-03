import sys
from PIL import Image

try:
    img_path = r"C:\Users\raulc\.gemini\antigravity\brain\416bb180-49c8-4543-a3ce-60a8eabc6830\media__1780362736520.png"
    img = Image.open(img_path)
    print(f"Format: {img.format}, Size: {img.size}, Mode: {img.mode}")
except Exception as e:
    print("Error:", e)
