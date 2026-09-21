# Penrose Tiling

An interactive exploration of **Penrose tilings using de Bruijn's pentagrid construction**.

[**Live Demo**](YOUR-GITHUB-PAGES-LINK) | [**Research Poster**](Penrose_Tiling_Poster.pdf)

## Overview

This project visualises the mathematical construction of Penrose tilings using de Bruijn's **pentagrid method**.

The interactive website lets you modify the pentagrid and see how it determines the corresponding Penrose tiling. You can explore individual rhombi, highlight ribbons associated with pentagrid lines, and watch the tiling assemble from a chosen starting tile.

The accompanying research poster explains the mathematical ideas behind the construction.

## Features

### Interactive Pentagrid

Adjust the pentagrid offsets and see the resulting Penrose tiling update instantly.

### Pentagrid and Tiling

View the five families of pentagrid lines together with their corresponding rhombus tiling.

### Ribbon Highlighting

Click a pentagrid line to highlight the ribbon of rhombi associated with that line.

### Rhombus Selection

Click a rhombus to inspect it or choose it as the starting point for the assembly animation.

### Assembly Animation

Watch the Penrose tiling assemble outward from a selected rhombus.

Controls include:

* Play / pause
* Replay
* Animation speed
* Timeline control
* Starting rhombus selection

### Export

Export the generated tiling as:

* SVG
* PNG
* JSON

## Mathematics

The construction follows de Bruijn's pentagrid method.

Five families of parallel lines are placed at angles separated by

```math
\frac{2\pi}{5}.
```

Intersections between pairs of pentagrid lines determine rhombi in the corresponding dual Penrose tiling.

## Repository

```text
Penrose-Tiling/
├── Penrose_Tiling_Poster.pdf
└── website/
    ├── index.html
    └── ...
```

## Research

**Author:** Isaac Hung
**Supervisor:** Yanki Lekili
**Institution:** Imperial College London
