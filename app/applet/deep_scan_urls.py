import os, re

pids = ["1", "5", "6", "14", "15", "579", "590", "591", "602"]
all_urls = set()

# Search for both raw and json-escaped or utf-16 ibb.co
for pid in pids:
    maps_file = f"/proc/{pid}/maps"
    mem_file = f"/proc/{pid}/mem"
    if not os.path.exists(maps_file): continue
    try:
        with open(maps_file, "r") as mf, open(mem_file, "rb", 0) as mem:
            for line in mf:
                parts = line.split()
                if len(parts) < 2 or "r" not in parts[1]: continue
                addr = parts[0].split("-")
                start = int(addr[0], 16)
                end = int(addr[1], 16)
                size = end - start
                # Read chunks
                offset = 0
                while offset < size:
                    chunk_size = min(20 * 1024 * 1024, size - offset)
                    try:
                        mem.seek(start + offset)
                        chunk = mem.read(chunk_size)
                    except:
                        break
                    offset += chunk_size
                    
                    if b"ibb.co" in chunk:
                        # Extract matches
                        # 1. Standard ascii
                        for m in re.finditer(rb"https?://(?:i\.)?ibb\.co/[a-zA-Z0-9_\-\./]+", chunk):
                            u = m.group(0).decode("utf-8", errors="ignore").rstrip("./\\\"\x00")
                            for sub in u.split("https"):
                                if sub.startswith("://"):
                                    full = "https" + sub
                                    if len(full) > 30:
                                        all_urls.add(full)
                        # 2. JSON escaped: https:\/\/i.ibb.co\/...
                        for m in re.finditer(rb"https?:\\/\\/(?:i\.)?ibb\.co\\/[a-zA-Z0-9_\-\./\\]+", chunk):
                            raw = m.group(0).decode("utf-8", errors="ignore").replace("\\/", "/")
                            for sub in raw.split("https"):
                                if sub.startswith("://"):
                                    full = "https" + sub
                                    if len(full) > 30:
                                        all_urls.add(full)
                        # 3. UTF-16
                        # Convert ascii regex to utf-16 pattern
                        for m in re.finditer(rb"h\x00t\x00t\x00p\x00s\x00:\x00/\x00/\x00[^\x00]+\x00i\x00b\x00b\x00\.\x00c\x00o\x00[^\x00\r\n\"]+", chunk):
                            try:
                                u = m.group(0).decode("utf-16", errors="ignore").rstrip("./\\\"\x00")
                                for sub in u.split("https"):
                                    if sub.startswith("://"):
                                        full = "https" + sub
                                        if len(full) > 30:
                                            all_urls.add(full)
                            except:
                                pass
    except Exception:
        pass

print(f"TOTAL URLS FOUND: {len(all_urls)}")
for u in sorted(all_urls):
    print(f"  \"{u}\",")
