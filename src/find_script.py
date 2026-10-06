import os, re

target = b"urllib.request"
for pid in ["1", "5", "6", "14", "15", "579", "591", "602"]:
    maps_file = f"/proc/{pid}/maps"
    mem_file = f"/proc/{pid}/mem"
    if not os.path.exists(maps_file): continue
    try:
        with open(maps_file, "r") as mf, open(mem_file, "rb", 0) as mem:
            for line in mf:
                parts = line.split()
                if "r" not in parts[1]: continue
                addr = parts[0].split("-")
                start = int(addr[0], 16)
                end = int(addr[1], 16)
                size = end - start
                offset = 0
                while offset < size:
                    to_read = min(10 * 1024 * 1024, size - offset)
                    try:
                        mem.seek(start + offset)
                        chunk = mem.read(to_read)
                    except:
                        break
                    offset += to_read
                    idx = chunk.find(target)
                    while idx != -1:
                        # Extract 3500 bytes around target
                        sub = chunk[max(0, idx - 100):min(len(chunk), idx + 4500)]
                        print("FOUND SCRIPT IN PID", pid)
                        with open("/app/applet/found_script.txt", "wb") as out:
                            out.write(sub)
                        print("Saved to /app/applet/found_script.txt, length:", len(sub))
                        idx = chunk.find(target, idx + len(target))
    except Exception as e:
        pass
