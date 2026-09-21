# Interactive pentagrid explorer

Run `npm start` from the repository root and open http://localhost:5173. The website is served from `website/`; the rebuilt poster is linked from `paper/`.

## Controls

- Four independent offsets; the fifth is balanced to keep their sum zero.
- Default, rosette, ribbon and singular examples; random offsets.
- Tiling, pentagrid or side-by-side view.
- Click a pentagrid line, or choose a family/index in the ribbon controls, to select every rhombus generated along that line. Clear selection restores the full view. Ribbon selection persists across shift changes and appears in SVG/PNG exports.
- Moving grid families darken; selected rhombi stay highlighted and track their indexed lines.
- Patch radius, colour palette, edge visibility, pan, zoom and reset-to-fit.
- **Animate assembly**, pause/continue, replay, timeline and playback speed.
- SVG, PNG and JSON export of the completed patch; URL-based pattern settings.

Animation starts with the pentagrid visible behind rhombi centred on its crossings, then translates and scales them to their exact projected positions. The grid fades out during assembly and is omitted from completed-pattern exports. Replaying or scrubbing back restores it. Shared-edge adjacency determines a breadth-first assembly order. A selected rhombus is used as the seed; otherwise the nearest-to-origin crossing is used. Changing the pattern resets animation to the completed new patch. Animation is user-triggered, pauses when the document is hidden, and never changes the underlying mathematical geometry.

Intermediate animation frames need not meet edge-to-edge. Exports always use the completed geometry. The animation is an original implementation inspired by [Fan Yang's Penrose DIY](https://github.com/fanyangxyz/penrose-diy).

## Development

From the repository root:

```sh
npm test
npm --prefix website ci       # Only needed to refresh KaTeX
npm run vendor:math
```

`src/pentagrid.js` is the pure geometry engine shared by the website and poster figure build. `src/assembly.js` computes adjacency, assembly order and transforms. `src/animation-controls.js` handles playback. `src/app.js` handles the main interface and exports.

LaTeX lives in `data-tex` attributes in `index.html`. `src/math.js` renders it with local KaTeX assets and accessible MathML. See [mathematical notes](docs/mathematics.md) for conventions and singular-grid handling.

The app has no runtime network dependencies. Local links only work on a computer serving this repository at the matching URL. Nothing has been published.
