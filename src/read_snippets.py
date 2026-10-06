import re

urls = []
for i in [1, 2, 3, 4]:
    try:
        with open(f"/app/applet/snippet_{i}.txt", "rb") as f:
            data = f.read()
            found = re.findall(rb"https://i\.ibb\.co/[a-zA-Z0-9_\-\./]+", data)
            if len(found) > len(urls):
                urls = found
                print(f"Snippet {i} has {len(found)} URLs")
    except Exception as e:
        print(f"Error reading snippet {i}: {e}")

cleaned_urls = []
seen = set()
for u in urls:
    s = u.decode("utf-8", errors="ignore").rstrip("./\\\"\x00")
    # if multiple merged
    for part in s.split("https"):
        if part.startswith("://"):
            full = "https" + part
            if len(full) > 25 and full not in seen:
                seen.add(full)
                cleaned_urls.append(full)

print("TOTAL EXTRACTED CLEAN URLS:", len(cleaned_urls))
for c in cleaned_urls:
    print(f'  "{c}",')
