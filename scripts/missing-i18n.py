"""Lista as chaves t('...') usadas no codigo que nao existem em src/lib/dictionary.ts (uso local, sem dependencias)."""
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parent.parent
dictionary = (root / "src/lib/dictionary.ts").read_text(encoding="utf-8")
defined = set(re.findall(r"^\s*'([\w.]+)':", dictionary, flags=re.M))

used = {}
for path in (root / "src").rglob("*.ts*"):
    if path.name.endswith(".test.ts") or path.name == "dictionary.ts":
        continue
    text = path.read_text(encoding="utf-8")
    for key in re.findall(r"\bt\(\s*'([\w.]+)'", text):
        used.setdefault(key, set()).add(path.relative_to(root).as_posix())
    # chaves em tabelas (ex.: { key: 'nav.home' }) e templates t(`state.${x}`) nao entram aqui

missing = sorted(k for k in used if k not in defined)
for key in missing:
    print(key, "<-", ", ".join(sorted(used[key])))
print(f"{len(missing)} faltando de {len(used)} usadas", file=sys.stderr)
sys.exit(1 if missing else 0)
