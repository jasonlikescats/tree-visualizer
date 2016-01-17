/// <reference path="typings/jquery/jquery.d.ts" />

// This is pretty ugly code - the main purpose here is just to contain
// everything that is jQuery/Bootstrap dependent, since I'm not sold that
// I'll be using that yet.

module ModalEditor {
    export function launchEditor(selector: string, onSubmit: (ctxt: any) => void, context: any) {
        var dlg: any = $(selector);

        dlg.modal({ show: true });

        var submitBtn = dlg.find("button");

        if (submitBtn.length === 0)
            console.log("Warning: modal dialog submit button not found");

        submitBtn.click((eventObject: JQueryEventObject) => {
                eventObject.preventDefault();

                submitBtn.off(eventObject);

                dlg.modal('hide');

                onSubmit(context);
            });
    }
}