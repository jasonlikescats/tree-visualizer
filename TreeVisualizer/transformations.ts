/// <reference path="containers.ts" />

module Transformations {

    export interface Transformable {
        transform(): TransformationManager;
    }

    export class TransformationManager {
        private elem: d3.Selection<Transformable>;

        private viewportSize: Containers.TwoDimensionData;
        private graphicSize:  Containers.TwoDimensionData;

        private translation: [number, number] = [0, 0];
        private scale = 1;

        constructor(transformableElement: d3.Selection<Transformable>, viewportSize: Containers.TwoDimensionData, graphicSize: Containers.TwoDimensionData) {
            this.elem = transformableElement;
            this.viewportSize = viewportSize;
            this.graphicSize = graphicSize;
        }

        updateViewportSize(newSize: Containers.TwoDimensionData) {
            this.viewportSize = newSize;

            // ensure our translation stays inbounds
            this.translate([0, 0]);
        }

        updateGraphicSize(newSize: Containers.TwoDimensionData) {
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

        private scaledGraphicSize(): Containers.TwoDimensionData {
            return new Containers.TwoDimensionData(
                new Containers.DimensionData(this.graphicSize.x.span * this.scale, this.graphicSize.x.margins),
                new Containers.DimensionData(this.graphicSize.y.span * this.scale, this.graphicSize.y.margins));
        }

        private translationLowBoundAdjuster(translation: number, lowBound: number, dimension: Containers.DimensionData): number {
            var limit = lowBound + dimension.margins[0];
            return (limit < translation) ? limit : translation;
        }

        private translationHighBoundAdjuster(translation: number, highBound: number, dimension: Containers.DimensionData): number {
            var limit = highBound - dimension.margins[1] - dimension.span;
            return (limit > translation) ? limit : translation;
        }

        translate(t: [number, number]) {
            var x = this.translation[0] + t[0];
            var y = this.translation[1] + t[1];

            var graphicSize = this.graphicSize.applyScale(this.scale);

            // Adjust to boundary max/mins (you really need to sketch this for it to make any sense). Note
            // that order matters here; when the viewport is larger than the graphic, out high boundary
            // constraint will always place us beyond the low boundary restriction, so we'll order it
            // conveniently so that we don't need to account for the graphic < viewport size case explicitly.
            x = this.translationHighBoundAdjuster(x, this.viewportSize.x.adjustedSpan(), graphicSize.x);
            x = this.translationLowBoundAdjuster(x, 0, graphicSize.x);

            y = this.translationHighBoundAdjuster(y, this.viewportSize.y.adjustedSpan(), graphicSize.y);
            y = this.translationLowBoundAdjuster(y, 0, graphicSize.y);

            this.translation = [x, y];
            this.updateTransform("translate", this.translation);
        }

        zoom(focalCenter: [number, number], scale: number) {
            if (scale === this.scale)
                return;

            this.scale = scale;

            this.updateTransform("scale", [scale]);

            // Ensure our translation stays in the bounds by forcing an update with no actual change provided
            this.translate([0, 0]);

            // TODO: Figure out how to zoom centered on mouse cursor, rather than center of canvas. The translate numbers
            //       from d3 for the zoom event don't make any sense to me...
        }
    }
}