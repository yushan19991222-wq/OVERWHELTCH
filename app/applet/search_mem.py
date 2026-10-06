import os
import re

pattern = re.compile(rb"https?://[a-zA-Z0-9_\-\.]*ibb\.co/[^\s\"\'\<\>\0\r\n\\,\}]+")
found = set()

for pid in ["6"]:
    maps_file = f"/proc/{pid}/maps"
    mem_file = f"/proc/{pid}/mem"
    if not os.path.exists(maps_file):
        continue
    try:
        with open(maps_file, "r") as mf, open(mem_file, "rb", 0) as mem:
            for line in mf:
                parts = line.split()
                if "r" not in parts[1]:
                    continue
                addr = parts[0].split("-")
                start = int(addr[0], 16)
                end = int(addr[1], 16)
                size = end - start
                if size > 150 * 1024 * 1024:
                    continue
                offset = 0
                while offset < size:
                    to_read = min(10 * 1024 * 1024, size - offset)
                    try:
                        mem.seek(start + offset)
                        chunk = mem.read(to_read)
                    except Exception:
                        break
                    offset += to_read
                    for m in pattern.findall(chunk):
                        found.add(m)
    except Exception as e:
        print("Error:", e)

clean_urls = set()
for raw in found:
    decoded = raw.decode("utf-8", errors="ignore")
    # Clean up trailing garbage
    decoded = re.sub(r"[^a-zA-Z0-9_\-\./].*$", "", decoded)
    if "ibb.co" in decoded and len(decoded) > 20:
        clean_urls.add(decoded)

print(f"Total found: {len(clean_urls)}")
with open("/app/applet/extracted_urls.txt", "w") as out:
    for u in sorted(clean_urls):
        print(u)
        out.write(u + "\n")
