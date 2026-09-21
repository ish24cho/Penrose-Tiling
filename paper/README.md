# Research poster

`Penrose_Tiling_Poster.pdf` is the rebuilt, single-page **120 × 72 cm landscape** poster. `poster.tex` is the editable source. Navy, light blue and coral are sampled from the original poster. The original text, section order and Figure 1–6 numbering are retained, apart from documented corrections. Figure 1 remains a LaTeX table, and Figures 2–6 are vector graphics; only the supplied institutional logo is raster artwork.

## Build

From the repository root:

```sh
python3 -m pip install -r paper/requirements.txt
npm run paper
```

Requirements: Python 3, Node.js 20+, and `pdflatex` (TeX Live or MacTeX, with geometry, Latin Modern, AMS packages and TikZ). No external font installation is necessary.

The build:

1. Runs `scripts/export-geometry.mjs`, importing `website/src/pentagrid.js` directly.
2. Generates five mathematical figures in both PDF and SVG using `scripts/figures.py`.
3. Compiles `poster.tex` twice, then writes the final PDF.

Intermediate JSON, compiler logs and caches stay in the ignored `paper/build/` directory. `figures/parameters.json` records the offsets, selected crossing and figure provenance.

## Figures

1. **Basic Penrose Rhombic Tiles:** the original table, typeset in LaTeX.
2. **Basic Penrose Rhombic Tiles:** regenerated thin and thick rhombi with angle labels.
3. **Pentagrid and Tiling:** a highlighted grid line and its full ribbon of rhombi.
4. **Pentagrid and vectors:** five unit normals with the corrected **2π/5** separation and their line families.
5. **Coordinates in Pentagrid:** four neighbouring cell labels and their corresponding projected vertices.
6. **Crossing and rhombus:** the same two indexed lines and rhombus highlighted in both planes.

Figures 3–6 use exactly the site's geometry. Figure 2 constructs the prototiles from their defining angles. SVG files are editable; PDF figures are embedded in the poster. The original Introduction, Fundamentals, Pentagrid Patterns, Construction, Conclusion and References sections remain in their original order. Website feature descriptions and the new animation are not inserted into the paper's original narrative.

## Corrections made

- Adjacent vector angle is **2π/5**, as requested by the author.
- Non-periodicity refers to translation of the entire tiling; finite patches recur.
- An open grid cell maps to a tiling vertex; a crossing maps to a rhombus.
- Grid cells are not necessarily pentagons.
- Changes to offsets preserve the zero-sum condition.
- References are corrected: the Williams thesis is by Laura Effinger-Dean, with Duane Bailey as advisor; the Utah lecturer is Andrejs Treibergs; de Bruijn's two papers occupy pages 39–52 and 53–66.

## Sources

- [N. G. de Bruijn, original papers I and II (1981)](https://new.math.uiuc.edu/oldnew/quasicrystals/papers/debruijnPenrose.pdf)
- [Laura Effinger-Dean, The Empire Problem in Penrose Tilings (2006)](https://www.cs.williams.edu/~bailey/06le.pdf)
- [Andrejs Treibergs, Penrose Tiling lecture slides](https://www.math.utah.edu/~treiberg/PenroseSlides.pdf)

The original submission and unused source images remain in the local archive, excluded from version control. The original source's third-party theme license is retained there. The new layout does not use that theme.
