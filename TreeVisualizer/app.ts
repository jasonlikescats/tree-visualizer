/// <reference path="Scripts/typings/d3/d3.d.ts" />

class DimensionData {
    public margins: [number, number] = [0, 0];

    constructor(public span: number, margins?: [number, number]) {
        if (margins) {
            this.margins = margins;
        }
    }

    adjustedSpan(): number {
        return (this.margins) ? this.span - this.margins[0] - this.margins[1] : this.span;
    }
}

class TwoDimensionData {
    constructor(public x: DimensionData, public y: DimensionData) { }
}

interface Transformable {
    transform(): TransformationManager;
}

class TransformationManager {
    private elem: d3.Selection<Transformable>;

    private viewportSize: TwoDimensionData;
    private graphicSize: TwoDimensionData;

    private translation: [number, number] = [0, 0];
    private scale = 1;

    constructor(transformableElement: d3.Selection<Transformable>, viewportSize: TwoDimensionData, graphicSize: TwoDimensionData) {
        this.elem         = transformableElement;
        this.viewportSize = viewportSize;
        this.graphicSize  = graphicSize;
    }

    updateViewportSize(newSize: TwoDimensionData) {
        this.viewportSize = newSize;
    }

    updateGraphicSize(newSize: TwoDimensionData) {
        this.graphicSize = newSize;
    }

    // Updates a single property in the transform matrix
    // e.g. updateTransform("translate", [1,2]) on an svg with
    // original transform attribute as "translate(0,0) scale(3)"
    // will result in "translate(1,2) scale(3)".
    private updateTransform(propName: string, propValue: number[]) {
        var transformation = this.elem.attr("transform") || "";

        var propPattern = new RegExp(propName + "\\([0-9, \-.]*\\)");
        
        var newValue = propName + "(" + propValue + ")";

        if (transformation.search(propPattern) == -1) {
            transformation += " " + newValue;
        } else {
            transformation = transformation.replace(propPattern, newValue);
        }

        this.elem.attr("transform", transformation);
    }

    private scaledGraphicSize(): TwoDimensionData {
        return new TwoDimensionData(
            new DimensionData(this.graphicSize.x.span * this.scale, this.graphicSize.x.margins),
            new DimensionData(this.graphicSize.y.span * this.scale, this.graphicSize.y.margins));
    }

    private translationLowBoundAdjuster(translation: number, lowBound: number, dimension: DimensionData): number {
        var limit = lowBound + dimension.margins[0];
        return (limit < translation) ? limit : translation;
    }

    private translationHighBoundAdjuster(translation: number, highBound: number, dimension: DimensionData): number {
        var limit = highBound - dimension.margins[1] - dimension.span;
        return (limit > translation) ? limit : translation;
    }

    translate(t: [number, number]) {
        var x = this.translation[0] + t[0];
        var y = this.translation[1] + t[1];

        var graphicSize = this.scaledGraphicSize();

        // Adjust to boundary max/mins (you really need to sketch this for it to make any sense). Note
        // that order matters here; when the viewport is larger than the graphic, out high boundary
        // constraint will always place us beyond the low boundary restriction, so we'll order it
        // conveniently so that we don't need to account for the graphic < viewport size case explicitly.
        x = this.translationHighBoundAdjuster(x, this.viewportSize.x.adjustedSpan(), graphicSize.x);
        x = this.translationLowBoundAdjuster (x, 0, graphicSize.x);

        y = this.translationHighBoundAdjuster(y, this.viewportSize.y.adjustedSpan(), graphicSize.y);
        y = this.translationLowBoundAdjuster (y, 0, graphicSize.y);

        this.translation = [x, y];
        this.updateTransform("translate", this.translation);
    }

    zoom(focalCenter: [number, number], scale: number) {
        if (scale === this.scale)
            return;

        this.scale = scale;

        this.updateTransform("scale", [scale]);

        // Ensure our translation stays in the bounds
        this.translate([0, 0]);
    }
}

interface Behavior {
    attach(target: d3.Selection<any>): void;
    invoke(event: d3.BaseEvent, self: Behavior): void;
}

class BaseZoomBehavior implements Behavior {
    private attachee: d3.behavior.Zoom<{}>;
    private affected: Array<Transformable>;

    constructor(affectedTransformables: Array<Transformable>) {
        this.affected = affectedTransformables;

        this.attachee = d3.behavior.zoom().scaleExtent([0,10]).on("zoom", () => { // TODO: allow negative (this breaks the scaled graphic size calculation right now though)
            if (d3.event.type !== "zoom")
                return;

            this.invoke(<d3.ZoomEvent>d3.event, this);
        });
    }

    attach(target: d3.Selection<any>): void {
        target.call(this.attachee);
    }

    invoke(event: d3.ZoomEvent, self: Behavior): void {
        (<BaseZoomBehavior>self).affected.forEach((value: Transformable, index: number, array: Transformable[]) => {
            value.transform().zoom(event.translate, event.scale);
        });
    }
}

class BaseDragBehavior implements Behavior { // TODO: abstract away the "drag" specific stuff into the base interface/abstract class
    private attachee: d3.behavior.Drag<{}>;

    constructor() {
        this.attachee = d3.behavior.drag().on("drag", () => {
            if (d3.event.type !== "drag")
                return;

            this.invoke(<d3.DragEvent>d3.event, this);
        });
    }

    attach(target: d3.Selection<any>): void {
        target.call(this.attachee);
    }

    invoke(event: d3.DragEvent, self: Behavior): void { /*nop*/ }
}

class PanningDragBehavior extends BaseDragBehavior {
    private affected: Array<Transformable>;

    constructor(affectedTransformables: Array<Transformable>) {
        this.affected = affectedTransformables;
        super();
    }

    invoke(event: d3.DragEvent, self: Behavior): void {
    // TODO: This behavior stuff is full of some awful casting and such right now. Can this be refactored with generics maybe?
        (<PanningDragBehavior>self).affected.forEach((value: Transformable, index: number, array: Transformable[]) => {
            value.transform().translate([event.dx, event.dy]);
        });
    }
}

class Canvas {
    private elem: d3.Selection<any>;
    private behaviors = new Array<Behavior>();

    constructor(elem: d3.Selection<any>) {
        this.elem = elem;
    }

    size(): TwoDimensionData {
        return new TwoDimensionData(
            new DimensionData(parseInt(this.elem.style("width"))),
            new DimensionData(parseInt(this.elem.style("height")))
        );
    }

    registerBehavior(b: Behavior) {
        var idx = this.behaviors.push(b) - 1;
        this.behaviors[idx].attach(this.elem);
    }
}

class TreeNode implements d3.layout.tree.Node {
    graphicId: number = null;
    name: string;

    // interface types
    parent: d3.layout.tree.Node;
    children: d3.layout.tree.Node[];
    depth: number;
    x: number;
    y: number;

    constructor(name: string, children: Array<TreeNode>) {
        this.name = name;
        this.children = children;
    }

    static fromJson(data: any): TreeNode {
        // TODO: should ensure only a single root from incoming data

        var children = new Array<TreeNode>();
        for (var i: number = 0; (data.children != null) && (i < data.children.length); ++i) {
            children.push(TreeNode.fromJson(data.children[i]));
        }

        return new TreeNode(data.name, children);
    }

    static onEnter(selection: d3.selection.Enter<TreeNode>) {
        var nodeGroup = selection
            .append("svg:g")
            .attr("class", "node")
            .attr("transform", (node): string => { return "translate(" + node.x + "," + node.y + ")"; });
            // TODO: bind a click event here

        nodeGroup
            .append("svg:circle")
            .attr("r", 15)
            .style("fill", (node: TreeNode): string => { return node.children ? "#fff" : "lightsteelblue"; }); // white fill if has children

        nodeGroup
            .append("svg:text")
            .attr("x", 0)
            .attr("dy", ".35em")
            .attr("text-anchor", 0)
            .text((node): string => { return node.name; });
    }

    static onUpdate(selection) {
        selection.attr("transform", (node): string => { return "translate(" + node.x + "," + node.y + ")"; });
    }

    static onExit(selection) {
        selection.remove(); // TODO: test me
    }
}

class Tree implements Transformable {
    private t: d3.layout.Tree<d3.layout.tree.Node>;
    private root: TreeNode;

    private nextNodeId = 0;

    private vis: d3.Selection<any>;
    private transformManager: TransformationManager;

    constructor(treeGroup: string, data: any, viewportSize: TwoDimensionData) {
        this.t = d3.layout.tree();
        this.vis = d3.select(treeGroup);

        // Parse the data into the tree root
        this.root = TreeNode.fromJson(data);

        // Calculate a size for our tree graphic based on the depth/breadth of the tree
        // TODO - calculate something that will give us a reasonable maximum size. For now, just hardcode.
        var graphicSize = new TwoDimensionData(new DimensionData(1920, [20, 20]), new DimensionData(1080, [120, 120]));
        this.t.size([graphicSize.x.adjustedSpan(), graphicSize.y.adjustedSpan()]); // size the tree

        // Initialize our transformation manager to handle panning and scaling, respecting the viewport and graphic sizes
        this.transformManager = new TransformationManager(this.vis, viewportSize, graphicSize);

        // Perform initial transformations
        this.transform().translate([graphicSize.x.margins[0], graphicSize.y.margins[0]]);

        // Update the drawing
        this.update();
    }

    transform(): TransformationManager { return this.transformManager; }

    update() {
        // Compute the new tree layout
        var computedNodes: TreeNode[] = <TreeNode[]>this.t.nodes(this.root);

        // Update the nodes' graphical representation
        var nodeSelection =
            this.vis.selectAll("g.node")
            // Assign an id in the node data to any nodes which don't yet have one
            .data(computedNodes, (node): string => { var id = node.graphicId || (node.graphicId = this.nextNodeId++); return id.toString() });
        
        nodeSelection.enter().call(TreeNode.onEnter);
        nodeSelection.exit ().call(TreeNode.onExit);
        nodeSelection.call(TreeNode.onUpdate);

        // Update the node links
        var linkSelection = this.vis.selectAll("path.link")
            .data(this.t.links(computedNodes), (link) => { return (<TreeNode>link.target).graphicId.toString(); }); // this cast is sketchy

        linkSelection.enter()
            .insert("svg:path", "g")
            .attr("class", "link")
            .attr("d", d3.svg.diagonal());
    }
}

var canvas;
var tree;

window.onload = () => {
    canvas = new Canvas(d3.select("#Graphic"));

    d3.json("data.json", (error: any, dataset: any) => {
        if (error) {
            alert("error loading JSON: " + error);
        }

        tree = new Tree("#ContainerGroup", dataset, canvas.size());

        canvas.registerBehavior(new PanningDragBehavior([tree]));
        canvas.registerBehavior(new BaseZoomBehavior([tree]));
        // TODO: Click behavior? (adding nodes, etc.)
    }); 
};

window.onresize = () => {
    tree.transform().updateViewportSize(canvas.size());
};