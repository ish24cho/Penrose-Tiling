# The poster’s construction in code

The interface follows the poster’s two sections titled **Constructing Penrose Tilings with Pentagrid**. The rebuilt poster and its editable source are in `paper/`. The original submission is preserved in a local archive excluded from Git.

## 1. Five line families

For j = 0, …, 4, set

```text
v_j = (cos(2πj/5), sin(2πj/5))
L_j(k) = { x : x · v_j + γ_j = k }, k ∈ ℤ
Σ γ_j = 0
```

**Figure correction, confirmed by the author and applied in the rebuilt poster:** the adjacent vector angle in Figure 4 should be **2π/5**, not π/5. The implementation uses 2π/5. These vectors are the normals to the grid lines and also the edge vectors of the dual rhombi.

Four independent sliders determine γ₀ through γ₃. The fifth is minus their sum. Independent arbitrary changes to all five shifts do not in general preserve this Penrose sum condition.

## 2. Cell coordinates

On each open cell, `K_j(x) = ceil(x · v_j + γ_j)` is constant. Cells are polygons, not necessarily pentagons. A cell corresponds to a **vertex** of the tiling, not a rhombus.

At the intersection of `L_r(k_r)` and `L_s(k_s)`, solve the two linear equations exactly up to floating-point arithmetic. Use `K_r = k_r`, `K_s = k_s`, and ceiling coordinates in the other three directions. Set the two intersecting coordinates explicitly; applying floating-point ceiling to a computed integer can introduce an off-by-one error.

## 3. Dual rhombus

```text
f(K) = Σ K_j v_j
vertices = f(K), f(K + e_r), f(K + e_r + e_s), f(K + e_s)
```

These vertices are ordered around the boundary, with edges v_r and v_s. Consecutive families (including 0 and 4) yield thick rhombi; the remaining pairs yield thin rhombi. All edges have length 1. Thick rhombi have angles 72°/108° and area sin(72°); thin rhombi have angles 36°/144° and area sin(36°).

## 4. Finite patches and singularities

We enumerate all pairs of lines whose intersections lie within a disk of the selected radius in **grid space**. For each family, line indices are bounded by `ceil(γ_j - radius)` and `floor(γ_j + radius)`. Dual tiles form a roughly circular finite patch. Increasing radius generates more tiles; zoom only changes the camera.

At a crossing, if a third coordinate is within 10⁻⁹ of an integer, the grid is treated as singular or numerically near-singular within the sampled patch. The usual four-cell prescription is then ambiguous. The engine adds a deterministic small perturbation in the direction

```text
(√2, -√3, √5, -√7, -√2 + √3 - √5 + √7)
```

starting at scale 10⁻⁶, and checks again. The sum remains zero. The interface and JSON expose the effective shifts; the SVG embeds settings and effective shifts in metadata. The result is a nearby regular grid, not a claim to reproduce the unresolved singular grid exactly. Regularity is checked only inside the generated finite patch.

## Interpretation and poster clarifications

- Aperiodicity rules out a nonzero translation of the **whole infinite tiling** onto itself. Finite patches do recur. The original statement that no finite patch repeats was corrected in the rebuilt poster.
- The thick/thin ratio approaches the golden ratio for large patches. Finite patches have boundary effects.
- Different slider settings can sometimes represent translated tilings or yield the same finite patch. Moving a slider does not guarantee a distinct local combinatorial pattern at every step.
- Equal-sided rhombi alone do not force a Penrose tiling. Here the regular zero-sum pentagrid construction supplies the global constraints; the app does not implement free placement or matching-rule arrows.

## References

- Isaac Hung, [Penrose Tiling poster](../../paper/Penrose_Tiling_Poster.pdf), Imperial College London (the supplied source).
- N. G. de Bruijn, *Algebraic theory of Penrose’s non-periodic tilings of the plane I, II* (1981). See the original publication for the equivalence theorem.
- Laura Effinger-Dean, [The Empire Problem in Penrose Tilings](https://www.cs.williams.edu/~bailey/06le.pdf), Williams College, 2006, Chapter 4, for the pentagrid and dual construction. Duane Bailey was the thesis advisor.
- Andrejs Treibergs, [Penrose Tiling](https://www.math.utah.edu/~treiberg/PenroseSlides.pdf), lecture slides linked in the poster.

The JavaScript geometry implementation is original code implementing the formulas above.

## Ribbon selection and animation

Selecting grid line `L_j(k)` highlights precisely the tiles whose generating pair contains family `j` with line index `k`. This is one ribbon (the correspondence shown in poster Figure 3), not all rhombi of a given orientation. Its identity persists when offsets change. The implementation and poster figure generator share the `belongsToLine` predicate.

Assembly is an illustrative animation of the current finite patch. Shared integer-coordinate edges define an adjacency graph. Breadth-first layers determine when each rhombus translates from near its scaled grid crossing and grows to its exact projected position. The selected rhombus is the initial seed when available. The final frame is the original geometry; intermediate frames may overlap or have gaps.
