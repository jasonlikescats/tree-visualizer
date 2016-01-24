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

        // Returns a copy with the scale applied (non-mutable)
        public applyScale(factor: number): DimensionData {
            if (factor <= 0) {
                throw "Logic error: scale factor out of range";
            }

            return new DimensionData(this.span * factor, [this.margins[0] * factor, this.margins[1] * factor]);
        }
    }

    export class TwoDimensionData {
        constructor(public x: DimensionData, public y: DimensionData) { }

        // Returns a copy with the scale applied (non-mutable)
        applyScale(factor: number): TwoDimensionData {
            return new TwoDimensionData(this.x.applyScale(factor), this.y.applyScale(factor));
        }
    }
}