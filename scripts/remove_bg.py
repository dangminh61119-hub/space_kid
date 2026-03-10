from PIL import Image
import numpy as np
import sys

def remove_checkered_bg(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    arr = np.array(img)
    
    # Calculate difference between color channels to find grays (r~=g~=b)
    # The checkered pattern in AI gen is usually perfectly gray
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    rg_diff = np.abs(r.astype(int) - g.astype(int))
    gb_diff = np.abs(g.astype(int) - b.astype(int))
    rb_diff = np.abs(r.astype(int) - b.astype(int))
    
    # Checkered bg is usually light gray (values > 180) with very low color difference
    is_gray = (rg_diff < 15) & (gb_diff < 15) & (rb_diff < 15)
    is_light = (r > 180) & (g > 180) & (b > 180)
    
    # Create mask where it is light gray
    mask = is_gray & is_light
    
    # Set alpha to 0 for the masked pixels
    arr[mask, 3] = 0
    
    out_img = Image.fromarray(arr)
    out_img.save(out_path)

remove_checkered_bg("public/images/luna_owl_avatar.png", "public/images/luna_owl_avatar_nobg.png")
