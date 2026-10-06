import os

target = b"m5H4BLpP"
pid = "6"
maps_file = f"/proc/{pid}/maps"
mem_file = f"/proc/{pid}/mem"

found = 0
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
                found += 1
                snippet = chunk[max(0, idx - 50):min(len(chunk), idx + 5000)]
                filename = f"/app/applet/snippet_{found}.txt"
                with open(filename, "wb") as out:
                    out.write(snippet)
                print(f"Found match {found}, saved to {filename}")
                idx = chunk.find(target, idx + len(target))

print(f"Total matches found: {found}")
