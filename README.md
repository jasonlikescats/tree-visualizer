Tree Visualizer
===

Overview
---

As an attempt to gain a working understanding of d3.js and become comfortable
fluent in TypeScript, this project is a reimplementation of the core of an
[example provided by mbostock](https://mbostock.github.io/d3/talk/20111018/tree.html).
To keep things interesting a few things will be tweaked and some additional features
added to make this the core of a tree based data visualization app.

Building & Running
---
A Visual Studio 2015 project file is supplied for compiling the TypeScript files. All 3rd
party dependencies are managed with Bower and tsd. Loading dependencies is a simple process
by running the following from the project directory (assuming Bower and tsd are installed globally):

1. `bower install`
2. `tsd reinstall`

TODO List
---

- Make the data JSON parser validate assumptions, and handle errors
- Fix zooming to be properly centered around mouse pointer