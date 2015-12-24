Tree Visualizer
===

Overview
---

As an attempt to gain a working understanding of d3.js and become comfortable
fluent in TypeScript, this project is a reimplementation of the core of an example
provided by mbostock (at https://mbostock.github.io/d3/talk/20111018/tree.html).
To keep things interesting a few things will be tweaked and some additional features
added to make this the core of a tree based data visualization app.

TODO List
---

### TLC
- Split components into logical modules
- Rethink this whole `TransformationManager` and `Transformable` idea (it's fairly
  tied to just transforming the canvas, whereas we're using raw SVG translations for
  the SVG DOM elements)
- There's some *awful* casting going on throughout. Yikes.
- Make the parser a little more bulletproof and check assumptions
- Error handling

### New functionality
- Implement bounds on panning behavior
- Implement zooming
- Select nodes and edit/add children to them
- Delete nodes