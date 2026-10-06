import os

for i in range(1, 34):
    path = f"/app/applet/public/memes/yawn/yawn-{i}.jpg"
    if not os.path.exists(path):
        path = f"/app/applet/public/memes/yawn/yawn-{i}.webp"
    if os.path.exists(path):
        with open(path, "rb") as f:
            data = f.read(4096) # first 4KB usually contains headers/exif
            # search for any ascii strings
            strings = []
            cur = []
            for b in data:
                if 32 <= b <= 126:
                    cur.append(chr(b))
                else:
                    if len(cur) >= 6:
                        strings.append("".join(cur))
                    cur = []
            relevant = [s for s in strings if any(k in s.lower() for k in ["ibb", "http", "81", "79", "78", "77", "80", "179", "180", "181", "186"])]
            if relevant:
                print(f"yawn-{i}:", relevant)
