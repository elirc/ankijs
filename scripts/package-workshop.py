from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parent.parent / 'public' / 'workshop'
target = root / 'recall-workshop.zip'
with ZipFile(target, 'w', ZIP_DEFLATED) as archive:
    for path in sorted(root.rglob('*')):
        if path.is_file() and path != target and not any(part in ('node_modules', 'bin', 'obj', 'dist') for part in path.relative_to(root).parts):
            archive.write(path, path.relative_to(root))
print(f'Packaged {target.stat().st_size:,} bytes')
