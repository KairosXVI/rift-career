"""Genera dist/artifact.html: la misma página sin <!DOCTYPE>/<html>/<head>/<body>,
que es el formato que espera la publicación como Artifact de claude.ai."""
import os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
head = re.search(r'<head>(.*)</head>', src, re.S).group(1)
body = re.search(r'<body>(.*)</body>', src, re.S).group(1)
keep = [l for l in head.splitlines() if l.strip().startswith(('<title', '<link', '<meta name="description"'))]
keep.insert(1, '<meta name="claude:viewport-fit-sides" content="cover">')
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
open(os.path.join(ROOT, 'dist', 'artifact.html'), 'w', encoding='utf-8').write('\n'.join(keep) + '\n' + body.strip() + '\n')
print('ok')
