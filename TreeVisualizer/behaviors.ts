/// <reference path="transformations.ts" />

module Behaviors {
    // This behavior dispatcher allows for multiple Transformable types to be tied to a single behavior
    export interface Behavior {
        attach(target: d3.Selection<any>): void;
    };

    class BehaviorBase<BehaviorT extends (sel: d3.Selection<any>, ...args: any[]) => any, EventT extends d3.BaseEvent> implements Behavior {
        private attachee: BehaviorT;
        private affected: Array<Transformations.Transformable>;
        private handler: (event: EventT, elem: Transformations.Transformable) => void;

        constructor(affectedTransformables: Array<Transformations.Transformable>, attachee: BehaviorT, handler: (event: EventT, elem: Transformations.Transformable) => void) {
            this.attachee = attachee;
            this.affected = affectedTransformables;
            this.handler = handler;
        }

        attach(target: d3.Selection<any>): void {
            target.call(this.attachee);
        }

        protected invoke(event: d3.BaseEvent, self: BehaviorBase<BehaviorT, EventT>): void {
            self.affected.forEach((value: Transformations.Transformable, index: number, array: Transformations.Transformable[]) => {
                self.handler(<EventT>event, value);
            });
        }
    }

    export class ZoomBehavior extends BehaviorBase<d3.behavior.Zoom<{}>, d3.ZoomEvent> {
        constructor(affectedTransformables: Array<Transformations.Transformable>) {
            var attachee = d3.behavior.zoom().scaleExtent([0, 10]).on("zoom", () => {
                this.invoke(<d3.ZoomEvent>d3.event, this);
            });

            var handler = (event: d3.ZoomEvent, elem: Transformations.Transformable) => {
                elem.transform().zoom(event.translate, event.scale);
            };

            super(affectedTransformables, attachee, handler);
        }
    }

    export class DragBehavior extends BehaviorBase<d3.behavior.Drag<{}>, d3.DragEvent> {
        constructor(affectedTransformables: Array<Transformations.Transformable>) {
            var attachee = d3.behavior.drag().on("drag", () => {
                this.invoke(<d3.DragEvent>d3.event, this);
            });

            var handler = (event: d3.DragEvent, elem: Transformations.Transformable) => {
                elem.transform().translate([event.dx, event.dy]);
            };

            super(affectedTransformables, attachee, handler);
        }
    }
}