from playwright.sync_api import sync_playwright
from pathlib import Path
from PIL import Image
from io import BytesIO
import runpy
root = Path(__file__).resolve().parents[1]
raw = runpy.run_path(str(root / 'tests/preview.py'))['raw']
frames = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'])
    page = browser.new_page(viewport={'width':960,'height':620},device_scale_factor=1)
    page.set_content(raw)
    for step in range(14):
        if step: page.wait_for_timeout(140)
        frame = Image.open(BytesIO(page.screenshot(animations='allow'))).convert('RGB')
        frame = frame.crop((240,80,720,560))
        frames.append(frame)
    browser.close()
out=Path('/mnt/data/Vinyl-Preview/Launch-v0.3.gif')
frames[0].save(out,save_all=True,append_images=frames[1:],duration=140,loop=0,optimize=True)
print(out, out.stat().st_size)
