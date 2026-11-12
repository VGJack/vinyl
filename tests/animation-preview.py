from pathlib import Path
from io import BytesIO
from PIL import Image
from playwright.sync_api import sync_playwright
source=Path(__file__).with_name('preview-v05.py').read_text().split('with sync_playwright() as p:')[0]
scope={'__file__':str(Path(__file__).with_name('preview-v05.py'))};exec(compile(source,'preview-v05.py','exec'),scope)
html=scope['html'];root=scope['root']
frames=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
 page.set_content(html)
 page.evaluate("document.querySelector('#launch-splash').remove()")
 for i in range(12):
  data=page.screenshot(type='png')
  frame=Image.open(BytesIO(data)).convert('RGB')
  frame.thumbnail((960,600))
  frames.append(frame.convert('P',palette=Image.Palette.ADAPTIVE,colors=128))
  page.wait_for_timeout(115)
 browser.close()
frames[0].save(root/'../../Vinyl-v0.5-Preview'/'Landing-Animation.gif',save_all=True,append_images=frames[1:]+[frames[-1]],duration=[115]*12+[1150],loop=0,optimize=True)
print('Saved landing animation')
