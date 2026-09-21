# Penrose Lab

An interactive companion to **Isaac Hung’s Penrose Tiling research poster**, Imperial College London. Generate finite patches of Penrose rhombus tilings using the poster’s **de Bruijn pentagrid construction**.

## Run locally

Requires Python 3. From this directory:

```sh
python3 -m http.server 5173 --bind 127.0.0.1
```

Open **http://localhost:5173**. If Node.js is installed, `npm start` runs the same command. The app runs without installing packages or building assets. KaTeX and its math fonts are bundled locally, so there are no runtime network dependencies. Serve the files over HTTP; opening `index.html` directly may block JavaScript modules.

## Explore

- Adjust four grid shifts; the fifth is calculated so the sum stays zero. While adjusting, the active pentagrid family darkens to black, the balancing fifth family appears in dark grey, and other families fade.
- The default style is black and white. The expanded methods section includes locally rendered LaTeX equations.
- Choose a starting arrangement or generate a random one.
- Compare the tiling and pentagrid side by side.
- Click a tile to inspect its generating crossing, grid families and integer coordinates. The **Inspect a tile** button also works from the keyboard.
- Change patch radius, palette and edge visibility. Drag to pan, scroll or use buttons to zoom, and use **Fit** to recenter.
- Export the full patch as vector SVG, a 2000 × 2000 PNG, or JSON containing settings, effective shifts, crossings and all tile vertices. Exports cover the whole patch regardless of the current pan or zoom.
- **Copy link to this pattern** saves shifts and appearance in the URL fragment. Localhost links require this app running on the recipient’s computer at the same address. Camera and selected tile are not saved.

Singular grids are resolved using a small deterministic zero-sum perturbation. The interface displays a notice and the effective shifts. This is a nearby regular grid, not an enumeration of all possible singular resolutions.

## Poster and mathematics

- [Original poster (PDF)](Penrose_Tiling_Poster.pdf) — preserved unchanged.
- [Construction and implementation notes](docs/mathematics.md).
- **Author’s pending correction:** Figure 4’s adjacent vector angle should read **2π/5**. The application already uses this value.
- Clarification: finite patches recur; non-periodicity means there is no nonzero translation preserving the entire infinite tiling.

## Repository structure

```text
Penrose_Tiling_Poster.pdf  Original research poster
index.html                Interface and method explanation
src/app.js                Controls, SVG views, inspection and exports
src/pentagrid.js           Pure geometry implementation
src/style.css             Responsive layout and styling
tests/pentagrid.test.js    Geometry and degeneracy checks
docs/mathematics.md        Formulas, conventions and references
```

## Validate

With Node.js 20 or newer:

```sh
npm test
```

Tests check unit edges, tile areas, the projection formula, edge sharing and disk topology, non-overlapping interiors, singular handling, changed geometry, and the large-patch tile ratio.

## Equation rendering

LaTeX is stored in `data-tex` attributes in `index.html` and rendered by `src/math.js` using [KaTeX](https://katex.org/docs/browser). Vendored JavaScript, CSS, fonts and its MIT license live in `vendor/katex/`. To refresh the bundled files after changing the pinned development dependency, run `npm ci` and `npm run vendor:math`. Ordinary use does not require npm.

## Scope and attribution

This version implements the pentagrid method developed in the poster. Matching-rule placement and substitution/inflation are not separate generation modes. All results are finite patches with an outer boundary; there are no matching-rule arrow decorations. The mathematical construction produces the arrangement.

The repository is local; no remote or public deployment is configured. No license has been chosen. The original poster retains its author’s attribution and third-party references.
