Tree Visualizer
===

Overview
---

As an attempt to gain a working understanding of d3.js and become comfortable
fluent in TypeScript, this project is a reimplementation of the core of an
[example provided by mbostock](https://mbostock.github.io/d3/talk/20111018/tree.html).
To keep things interesting a few things will be tweaked and some additional features
added to make this the core of a tree based data visualization app.

TODO List
---

### TLC
- Split components into logical modules
- Fix zooming to be properly centered around mouse pointer
- There's some *awful* casting going on throughout. Yikes.
- Make the parser a little more bulletproof and check assumptions
- Error handling

### New functionality
- Select nodes and edit/add children to them
- Delete nodes