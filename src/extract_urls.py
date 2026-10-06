import re

with open("/app/applet/found_script.txt", "rb") as f:
    data = f.read()

urls = re.findall(rb"https://i\.ibb\.co/[a-zA-Z0-9_\-\./]+", data)
print(f"EXTRACTED {len(urls)} EXACT URLS:")
seen = set()
clean_urls = []
for u in urls:
    clean = u.decode("utf-8").rstrip("\x00\"'\\")
    if clean not in seen and len(clean) > 30:
        seen.add(clean)
        clean_urls.append(clean)

print(f"UNIQUE COUNT: {len(clean_urls)}")
with open("/app/applet/src/extracted_urls.json", "w") as out:
    import json
    json.dump(clean_urls, out, indent=2)

for c in clean_urls:
    print(f'  "{c}",')
