with open('d:/SOFT-MEDIC/Antigravity/JHASMANY/jhasmany-frontend-main/src/components/PacienteForm.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for line_num, line in enumerate(lines, 1):
    if 'habito_' in line:
        print(f"{line_num}: {line.strip()}")
