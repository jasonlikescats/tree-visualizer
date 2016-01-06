/// <reference path="containers.ts" />
/// <reference path="behaviors.ts" />
/// <reference path="modalEditor.ts" />

module Graphic {
    export class Canvas {
        private elem: d3.Selection<any>;
        private behaviors = new Array<Behaviors.Behavior>();

        constructor(elem: d3.Selection<any>) {
            this.elem = elem;
        }

        size(): Containers.TwoDimensionData {
            return new Containers.TwoDimensionData(
                new Containers.DimensionData(parseInt(this.elem.style("width"))),
                new Containers.DimensionData(parseInt(this.elem.style("height")))
            );
        }

        registerBehavior(b: Behaviors.Behavior) {
            var idx = this.behaviors.push(b) - 1;
            this.behaviors[idx].attach(this.elem);
        }
    }

    export class TreeNode implements d3.layout.tree.Node {
        tree: Graphic.Tree;

        graphicId: number = null;
        name: string;

        // interface types
        parent: d3.layout.tree.Node;
        children: d3.layout.tree.Node[];
        depth: number;
        x: number;
        y: number;

        constructor(name: string, tree: Tree, children?: Array<TreeNode>) {
            this.name = name;
            this.tree = tree;
            if (children) {
                this.children = children;
            }
        }

        static fromJson(data: any, tree: Tree): TreeNode {
            // TODO: should ensure only a single root from incoming data

            var children = new Array<TreeNode>();
            for (var i: number = 0; (data.children != null) && (i < data.children.length); ++i) {
                children.push(TreeNode.fromJson(data.children[i], tree));
            }

            return new TreeNode(data.name, tree, children);
        }

        static onEnter(selection: d3.selection.Enter<TreeNode>) {
            var nodeGroup = selection
                .append("svg:g")
                .attr("class", "node")
                .attr("transform", (node): string => { return "translate(" + node.x + "," + node.y + ")"; })
                .on("click", (datum: TreeNode, index: number, outerIndex: number): any => { return datum.onClick(); });

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
            selection
                .attr("transform", (node): string => {
                    return "translate(" + node.x + "," + node.y + ")";
                });
        }

        static onExit(selection) {
            selection.remove(); // TODO: test me
        }

        private onClick() {
            ModalEditor.launchEditor("#node-data-modal", (self: TreeNode) => {
                // Get the name from the form
                var name = <string>d3.select("#nodeName").property("value");

                // TODO: Figure out why this is needed sometimes...
                if (self.children === undefined) {
                    self.children = new Array<TreeNode>();
                }

                self.children.push(new TreeNode(name, self.tree));

                self.tree.update();
            }, this);
        }
    }

    export class Tree implements Transformations.Transformable {
        private t: d3.layout.Tree<d3.layout.tree.Node>;
        private root: TreeNode;

        private nextNodeId = 0;

        private vis: d3.Selection<any>;
        private transformManager: Transformations.TransformationManager;

        constructor(treeGroup: string, data: any, viewportSize: Containers.TwoDimensionData) {
            this.t = d3.layout.tree();
            this.vis = d3.select(treeGroup);

            // Parse the data into the tree root
            this.root = TreeNode.fromJson(data, this);

            // Calculate a size for our tree graphic based on the depth/breadth of the tree
            // TODO - calculate something that will give us a reasonable maximum size. For now, just hardcode.
            var graphicSize = new Containers.TwoDimensionData(new Containers.DimensionData(1920, [20, 20]), new Containers.DimensionData(1080, [120, 120]));
            this.t.size([graphicSize.x.adjustedSpan(), graphicSize.y.adjustedSpan()]); // size the tree

            // Initialize our transformation manager to handle panning and scaling, respecting the viewport and graphic sizes
            this.transformManager = new Transformations.TransformationManager(this.vis, viewportSize, graphicSize);

            // Perform initial transformations
            this.transform().translate([graphicSize.x.margins[0], graphicSize.y.margins[0]]);

            // Update the drawing
            this.update();
        }

        transform(): Transformations.TransformationManager { return this.transformManager; }

        update() {
            // Compute the new tree layout
            var computedNodes: TreeNode[] = <TreeNode[]>this.t.nodes(this.root);

            // Update the nodes' graphical representation
            var nodeSelection =
                this.vis.selectAll("g.node")
                    // Assign an id in the node data to any nodes which don't yet have one
                    .data(computedNodes, (node): string => { var id = node.graphicId || (node.graphicId = this.nextNodeId++); return id.toString() });

            nodeSelection.enter().call(TreeNode.onEnter);
            nodeSelection.exit().call(TreeNode.onExit);
            nodeSelection.call(TreeNode.onUpdate);

            this.updateNodeLinks(computedNodes);
        }

        private updateNodeLinks(computedNodes: TreeNode[]) {
            var linkSelection = this.vis.selectAll("path.link")
                .data(this.t.links(computedNodes), (link) => {
                    return (<TreeNode>link.target).graphicId.toString();
                });

            linkSelection.enter()
                .insert("svg:path", "g")
                .attr("class", "link")
                .attr("d", d3.svg.diagonal());

            linkSelection.attr("d", d3.svg.diagonal());
        }
    }
}