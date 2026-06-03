with open(r'd:\SOFT-MEDIC\Antigravity\JHASMANY\jhasmany-backend-main\broken_files.txt', 'r', encoding='utf-16') as f:
    lines = f.readlines()
    for line in lines:
        print(line.strip())
