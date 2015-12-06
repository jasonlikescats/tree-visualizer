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
    private translation: [number, number];

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
    invoke(event: d3.BaseEvent): void;
}

class BaseDragBehavior implements Behavior {
    private attachee: d3.behavior.Drag<{}>;
    name: string = "drag";

    constructor() {
        this.attachee = d3.behavior.drag().on(this.name, this.invoke);
    }

    attach(target: d3.Selection<any>): void {
        target.call(this.attachee);
    }

    invoke(event: d3.DragEvent): void { /*nop*/ }
}

class PanningDragBehavior extends BaseDragBehavior {
    private affected: Array<Transformable>;

    constructor(affectedTransformables: Array<Transformable>) {
        this.affected = affectedTransformables;
        super();
    }

    invoke(event: d3.DragEvent): void {
        this.affected.forEach((value: Transformable, index: number, array: Transformable[]) => {
            value.transform().translate([event.dx, event.dy]);
        });
    }
}

class Graphic {
    private elem: d3.Selection<any>;
    private behaviors: Array<Behavior>;

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
        var idx = this.behaviors.push(b);
        this.behaviors[idx].attach(this.elem);
    }
}

class Tree implements Transformable {
    private t: d3.layout.Tree<d3.layout.tree.Node>;
    private transformManager: TransformationManager;

    constructor(xDim: DimensionData, yDim: DimensionData, treeGroup: string) {
        this.t = d3.layout.tree();
        this.transformManager = new TransformationManager(d3.select(treeGroup));

        this.t.size([yDim.adjustedSpan(), xDim.adjustedSpan()]); // size the tree initially to fit in the dimensions
        this.transform().translate([xDim.margins[0], yDim.margins[0]]); // translate to the initial margins
    }

    transform(): TransformationManager {
        return this.transformManager;
    }
}

class Diagonal {
    // TODO
}

window.onload = () => {
    var graphic = new Graphic(d3.select("#Graphic"));

    var graphicSize = graphic.size();
    var xDimensions = new DimensionData(graphicSize.width,  [20, 20]);
    var yDimensions = new DimensionData(graphicSize.height, [120, 120]);

    var tree = new Tree(xDimensions, yDimensions, "#ContainerGroup");
    
    graphic.registerBehavior(new PanningDragBehavior([tree]));
    // TODO: Zoom behavior


};