/// <reference path="Scripts/typings/d3/d3.d.ts" />

/// <reference path="graphic.ts" />
/// <reference path="containers.ts" />
/// <reference path="behaviors.ts" />
/// <reference path="transformations.ts" />

var canvas: Graphic.Canvas;
var tree: Graphic.Tree;

window.onload = () => {
    canvas = new Graphic.Canvas(d3.select("#Graphic"));

    d3.json("data.json", (error: any, dataset: any) => {
        if (error) {
            alert("error loading JSON: " + error);
        }

        tree = new Graphic.Tree("#ContainerGroup", dataset, canvas.size());

        canvas.registerBehavior(new Behaviors.DragBehavior([tree]));
        canvas.registerBehavior(new Behaviors.ZoomBehavior([tree]));
    });
};

window.onresize = () => {
    if (!tree) return;

    tree.transform().updateViewportSize(canvas.size());
};