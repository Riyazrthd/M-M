import json

with open('checklist_dump.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

with open('sheets_structure.txt', 'w', encoding='utf-8') as out:
    for sheet_name, rows in data.items():
        out.write(f"\n==================== {sheet_name} ====================\n")
        for r in rows:
            non_empty = [(idx, str(val).strip()) for idx, val in enumerate(r['values']) if str(val).strip() != '']
            if non_empty:
                line_str = " | ".join([f"C{idx}:{val}" for idx, val in non_empty])
                out.write(f"R{r['row']:02d}: {line_str}\n")
print("Done writing sheets_structure.txt")
