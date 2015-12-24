/// <reference path="Scripts/typings/d3/d3.d.ts" />

class DimensionData {
    span: number;
    margins: [number, number];

    constructor(span: number, margins: [number, number]) {
        this.span = span;
        this.margins = margins;
    }

    adjustedSpan(): number {
        return this.span - this.margins[0] - this.margins[1];
    }
}

interface Transformable {
    transform(): TransformationManager;
}

class TransformationManager {
    private elem: d3.Selection<Transformable>;
    private translation: [number, number] = [0,0];

    constructor(transformableElement: d3.Selection<Transformable>) {
        this.elem = transformableElement;
    }

    translate(t: [number, number]) {
        var x = this.translation[0] + t[0];
        var y = this.translation[1] + t[1];

        this.translation = [x, y];
        this.elem.attr("transform", "translate(" + this.translation + ")");
    }
}

interface Behavior {
    name: string;

    attach(target: d3.Selection<any>): void;
    invoke(event: d3.BaseEvent, self: Behavior): void;
}

class BaseDragBehavior implements Behavior { // TODO: abstract away the "drag" specific stuff into the base interface/abstract class
    private attachee: d3.behavior.Drag<{}>;
    name: string = "drag";

    constructor() {
        this.attachee = d3.behavior.drag().on(this.name, () => {
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
            // TODO: Need to implement bounding on the panning so we don't end up panning ourselves offscreen
        });
    }
}

class Graphic {
    private elem: d3.Selection<any>;
    private behaviors = new Array<Behavior>();

    constructor(elem: d3.Selection<any>) {
        this.elem = elem;
    }

    size() {
        return {
            width: parseInt(this.elem.style("width")),
            height: parseInt(this.elem.style("height"))
        };
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

    constructor(xDim: DimensionData, yDim: DimensionData, treeGroup: string) {
        this.t = d3.layout.tree();
        this.vis = d3.select(treeGroup);
        this.transformManager = new TransformationManager(this.vis);

        this.t.size([yDim.adjustedSpan(), xDim.adjustedSpan()]); // size the tree initially to fit in the dimensions
        this.transform().translate([xDim.margins[0], yDim.margins[0]]); // translate to the initial margins
    }

    transform(): TransformationManager {
        return this.transformManager;
    }

    initializeRoot(data: any) {
        this.root = TreeNode.fromJson(data);

        this.update();
    }

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

window.onload = () => {
    var graphic = new Graphic(d3.select("#Graphic"));

    var graphicSize = graphic.size();
    var xDimensions = new DimensionData(graphicSize.width,  [20, 20]);
    var yDimensions = new DimensionData(graphicSize.height, [120, 120]);

    var tree = new Tree(xDimensions, yDimensions, "#ContainerGroup");
      
    graphic.registerBehavior(new PanningDragBehavior([tree]));
    // TODO: Zoom behavior
    // TODO: Click behavior? (adding nodes, etc.)

    d3.json("data.json", (err, data) => {
        // TODO: check error
        tree.initializeRoot(data);
    });
};