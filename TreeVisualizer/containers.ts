module Containers {
    export class DimensionData {
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

    export class TwoDimensionData {
        constructor(public x: DimensionData, public y: DimensionData) { }
    }
}