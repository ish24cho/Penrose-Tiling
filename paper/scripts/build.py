"""Build figures from the website engine, then compile the editable LaTeX poster."""
from pathlib import Path
import os
import shutil
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
PAPER = ROOT / 'paper'
BUILD = PAPER / 'build'
BUILD.mkdir(exist_ok=True)
env = os.environ.copy()
env['MPLCONFIGDIR'] = str(BUILD / 'matplotlib')
env['XDG_CACHE_HOME'] = str(BUILD / 'cache')
subprocess.run(['node', str(PAPER / 'scripts/export-geometry.mjs')], check=True, cwd=ROOT)
subprocess.run(['python3', str(PAPER / 'scripts/figures.py')], check=True, cwd=ROOT, env=env)
compiler = shutil.which('pdflatex') or '/Library/TeX/texbin/pdflatex'
for _ in range(2):
    result = subprocess.run([compiler, '-interaction=nonstopmode', '-halt-on-error', '-output-directory=build', 'poster.tex'], cwd=PAPER, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    (BUILD / 'compile-output.txt').write_text(result.stdout)
    if result.returncode:
        print(result.stdout[-8000:])
        raise SystemExit(result.returncode)
heights = [float(h) for h in re.findall(r'POSTER .* HEIGHT: ([0-9.]+)pt', result.stdout)]
if len(heights) != 3 or max(heights) > 1670:
    raise RuntimeError(f'Poster column exceeds the safe area: {heights}')
if 'Overfull' in result.stdout:
    raise RuntimeError('LaTeX reported an overfull box; inspect paper/build/compile-output.txt')
shutil.copyfile(BUILD / 'poster.pdf', PAPER / 'Penrose_Tiling_Poster.pdf')
print('Built paper/Penrose_Tiling_Poster.pdf')
for line in result.stdout.splitlines():
    if 'POSTER ' in line or 'Overfull' in line: print(line)
