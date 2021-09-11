## Cheatsheet

#### Tools

<img src="src/assets/pan.svg" alt="pan" width="24px"/>: drag to move around the canvas (shortcut: hold <kbd>Space</kbd> down).

<img src="src/assets/sel.svg" alt="pan" width="24px"/>: click to select an existing shape and edit its properties.

<img src="src/assets/e.svg" alt="pan" width="24px"/>: click to draw a line. Each click determines the coordinates of an end point.

<img src="src/assets/circle.svg" alt="pan" width="24px"/>: click to draw a circle. The first click determines the coordinates of the center; the second click determines the radii. A circle can be edited into an ellipse when selected.

<img src="src/assets/polygon.svg" alt="pan" width="24px"/>: click to draw a polygon. Each click creates a corner. A polygons is a closed shape. The first and last click must occur at the same coordinates.

<img src="src/assets/curve2.svg" alt="pan" width="24px"/>: click and drag to draw cubic Bezier curves (see [here](https://www.drububu.com/animation/beziercurves/index.html) for an introduction). Each click creates an anchor and each drag creates one or a pair of handles. During drawing, when <kbd>Shift</kbd> is pressed, the most recently created handle is reset to the the most recently created anchor. Curves can be closed or open: when drawing curves, clicking on the starting anchor closes it; pressing <kbd>Enter</kbd> finishes and creates an open curve.

<img src="src/assets/text.svg" alt="pan" width="24px"/>: insert texts (supports inline math).

<img src="src/assets/undo.svg" alt="pan" width="24px"/>: undo (shortcuts: <kbd>Ctrl</kbd>-<kbd>Z</kbd> / <kbd>Cmd</kbd>-<kbd>Z</kbd>).

<img src="src/assets/redo.svg" alt="pan" width="24px"/>: redo (shortcuts: <kbd>Ctrl</kbd>-<kbd>Y</kbd> / <kbd>Cmd</kbd>-<kbd>Y</kbd> / <kbd>Shift</kbd>-<kbd>Cmd</kbd>-<kbd>Z</kbd>).

<img src="src/assets/code.svg" alt="pan" width="24px"/>: show TikZ code.

<img src="src/assets/save.svg" alt="pan" width="24px"/>: copy a url to clipboard that allows future access to the current drawing (shortcuts: <kbd>Ctrl</kbd>-<kbd>S</kbd> / <kbd>Cmd</kbd>-<kbd>S</kbd>).

#### Shape Editing

When an existing shape is selected, a property box shows up. Properties of shapes can be changed there. Additionally, two buttons appear

- <img src="src/assets/magnet.svg" alt="pan" width="24px"/>: toggle snapping. When it is checked, shapes and points can only move by multiples of half of the size of a grid cell. Snapping will be turned on automatically when drawing new shapes.

- <img src="src/assets/trashcan.svg" alt="pan" width="24px"/>: delete selected shape (shortcuts: <kbd>DELETE</kbd> / <kbd>BACKSPACE</kbd>).

On the canvas, a shadow and some control points will appear around the selected shape. Move the selected shape around by dragging the shadow; change its shape by dragging the points.

[Sep.10, 2021] When a shape is selected, you can press  <kbd>Ctrl</kbd>-<kbd>C</kbd> / <kbd>Cmd</kbd>-<kbd>C</kbd> to copy it and then <kbd>Ctrl</kbd>-<kbd>V</kbd> / <kbd>Cmd</kbd>-<kbd>V</kbd> to paste a copy to the current pointer location.

#### Shortcuts

Hold <kbd>SPACE</kbd> down: set tool to <img src="src/assets/pan.svg" alt="pan" width="24px"/>.

<kbd>Ctrl</kbd>-<kbd>Z</kbd> / <kbd>Cmd</kbd>-<kbd>Z</kbd>: <img src="src/assets/undo.svg" alt="pan" width="24px"/>.

<kbd>Ctrl</kbd>-<kbd>Y</kbd> / <kbd>Cmd</kbd>-<kbd>Y</kbd> / <kbd>Shift</kbd>-<kbd>Cmd</kbd>-<kbd>Z</kbd>: <img src="src/assets/redo.svg" alt="pan" width="24px"/>.

<kbd>Ctrl</kbd>-<kbd>S</kbd> / <kbd>Cmd</kbd>-<kbd>S</kbd>: <img src="src/assets/save.svg" alt="pan" width="24px"/>.

<kbd>Ctrl</kbd>-<kbd>C</kbd> / <kbd>Cmd</kbd>-<kbd>C</kbd> : copy selected shape. [Sep.10, 2021]

<kbd>Ctrl</kbd>-<kbd>V</kbd> / <kbd>Cmd</kbd>-<kbd>V</kbd> : paste copied shape to pointer location. [Sep.10, 2021]

<kbd>Esc</kbd>: abort drawing process (delete shapes that are being created, like unclosed polygon, unsubmitted text input, etc).

<kbd>Enter</kbd>: finish curve drawing (creates an open curve).

Shift: reset last handle to its corresponding anchor when drawing curves.

<kbd>DELETE</kbd> / <kbd>BACKSPACE</kbd>: <img src="src/assets/trashcan.svg" alt="pan" width="24px"/>.

Mouse wheel: zoom.

