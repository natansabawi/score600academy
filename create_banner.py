from PIL import Image, ImageDraw, ImageFont

# Create a 640x360 canvas with deep blue background
banner = Image.new('RGB', (640, 360), color='#0b1f36')
draw = ImageDraw.Draw(banner)

# Load fonts (Using Windows Nyala font for Amharic support)
try:
    font_title = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 28)
    font_sub = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 16)
    font_amharic = ImageFont.truetype("C:/Windows/Fonts/nyala.ttf", 20)
except:
    font_title = ImageFont.load_default()
    font_sub = ImageFont.load_default()
    font_amharic = ImageFont.load_default()

# Draw text with proper styling
draw.text((320, 120), "Score600Academy", fill="#d4af37", anchor="mm", font=font_title)
draw.text((320, 175), "Grades 9 - 12 Free Study Materials & PDFs", fill="#ffffff", anchor="mm", font=font_sub)
draw.text((320, 220), "የ9ኛ - 12ኛ ክፍል ነፃ የማጥኛ ማስታወሻዎች", fill="#f3e5ab", anchor="mm", font=font_amharic)

# Save the banner image
banner.save('bot_banner.png')
print("SUCCESS! Fixed bot_banner.png generated.")