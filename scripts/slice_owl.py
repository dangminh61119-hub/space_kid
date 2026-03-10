import cv2
import numpy as np

try:
    # Load original
    img = cv2.imread('public/images/luna_owl_avatar.png', cv2.IMREAD_UNCHANGED)
    if img is None:
        print("Error: Could not read image")
        exit(1)
        
    h, w = img.shape[:2]
    
    # Extract alpha channel if it exists
    if img.shape[2] == 4:
        b, g, r, a = cv2.split(img)
    else:
        print("Image does not have an alpha channel")
        a = np.ones((h, w), dtype=np.uint8) * 255
        b, g, r = cv2.split(img)

    # 1. FIND EYES (Dark and large)
    gray = cv2.cvtColor(cv2.merge([b, g, r]), cv2.COLOR_BGR2GRAY)
    _, dark_mask = cv2.threshold(gray, 50, 255, cv2.THRESH_BINARY_INV)
    dark_mask = cv2.bitwise_and(dark_mask, a)

    # Morph to clean up
    kernel = np.ones((5,5), np.uint8)
    dark_mask = cv2.morphologyEx(dark_mask, cv2.MORPH_OPEN, kernel)

    # Find contours
    contours, _ = cv2.findContours(dark_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    eye_contours = []
    
    for cnt in contours:
        x, y, cw, ch = cv2.boundingRect(cnt)
        # Eyes are usually in the top 60% of the image, and decently sized
        if y < h * 0.6 and cw * ch > (h * w * 0.005) and cw * ch < (h * w * 0.15):
            # Check aspect ratio (eyes are somewhat square/round)
            aspect_ratio = float(cw)/ch
            if 0.5 < aspect_ratio < 1.5:
                eye_contours.append(cnt)

    eye_contours = sorted(eye_contours, key=cv2.contourArea, reverse=True)[:2]

    eyes_mask = np.zeros((h, w), dtype=np.uint8)
    for cnt in eye_contours:
        (cx, cy), radius = cv2.minEnclosingCircle(cnt)
        # Expand eye mask slightly to get the glowing iris
        cv2.circle(eyes_mask, (int(cx), int(cy)), int(radius * 1.4), 255, -1)

    # Extract eyes
    eyes_img = img.copy()
    eyes_img[:,:,3] = cv2.bitwise_and(a, eyes_mask)
    cv2.imwrite('public/images/luna_owl_eyes.png', eyes_img)

    # 2. FIND BEAK (Orange/Yellow, below eyes)
    hsv = cv2.cvtColor(cv2.merge([b, g, r]), cv2.COLOR_BGR2HSV)
    # Beak in chibi space owl is usually gold/orange
    lower_orange = np.array([5, 100, 100])
    upper_orange = np.array([45, 255, 255])
    beak_mask = cv2.inRange(hsv, lower_orange, upper_orange)
    beak_mask = cv2.bitwise_and(beak_mask, a)

    contours, _ = cv2.findContours(beak_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    beak_contours = []
    
    if len(eye_contours) >= 1:
        eyes_y = min([cv2.boundingRect(c)[1] for c in eye_contours])
    else:
        eyes_y = h * 0.3

    for cnt in contours:
        x, y, cw, ch = cv2.boundingRect(cnt)
        # Beak is below the top of the eyes, usually centrally located
        if y > eyes_y and cw * ch > 20 and cw * ch < (h * w * 0.05):
            beak_contours.append(cnt)

    if beak_contours:
        beak_contour = max(beak_contours, key=cv2.contourArea)
        beak_drawn_mask = np.zeros((h, w), dtype=np.uint8)
        x, y, cw, ch = cv2.boundingRect(beak_contour)
        # Extract lower half of the beak for moving part, or extract the whole beak
        cv2.rectangle(beak_drawn_mask, (x-8, y-5), (x+cw+8, y+ch+8), 255, -1)
        
        beak_img = img.copy()
        beak_img[:,:,3] = cv2.bitwise_and(a, beak_drawn_mask)
        cv2.imwrite('public/images/luna_owl_beak.png', beak_img)
    else:
        print("Warning: Beak not found")
        beak_drawn_mask = np.zeros((h, w), dtype=np.uint8)

    # 3. BASE OWL (Inpaint eyes and beak)
    combined_mask = cv2.bitwise_or(eyes_mask, beak_drawn_mask)
    
    # Inpaint to remove eyes and beak from the base body
    base_bgr = cv2.inpaint(cv2.merge([b, g, r]), combined_mask, 20, cv2.INPAINT_TELEA)
    base_img = cv2.merge((base_bgr[:,:,0], base_bgr[:,:,1], base_bgr[:,:,2], a))
    cv2.imwrite('public/images/luna_owl_base.png', base_img)

    print("SUCCESS: Eyes and beak extracted and base inpainted.")
except Exception as e:
    print(f"Error: {e}")
