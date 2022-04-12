// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    const TENANT_DROPDOWN_ID = 'tenant';
    const WORKFLOW_DROPDOWN_ID = 'workflow';
    const PAYLOAD_TEXTAREA_ID = 'payload';
    const SUBMIT_BUTTON_ID = 'submit-button';

    var workflows = [];
    var triggers = [];


    // const oldState = vscode.getState() || { colors: [] };

    // /** @type {Array<{ value: string }>} */
    // let colors = oldState.colors;

    // updateColorList(colors);

    // document.querySelector('.add-color-button').addEventListener('click', () => {
    //     addColor();
    // });
    const tenantDropDown = document.getElementById(TENANT_DROPDOWN_ID);
    tenantDropDown.addEventListener('change', onTenantDropDownChange);
    const workflowDropDown = document.getElementById(WORKFLOW_DROPDOWN_ID);
    workflowDropDown.addEventListener('change', onWorkflowDropDownChange);
    const payloadTextarea = document.getElementById(PAYLOAD_TEXTAREA_ID);
    payloadTextarea.addEventListener('input', toggleSubmitButton);
    const submitButton = document.getElementById(SUBMIT_BUTTON_ID);
    submitButton.addEventListener('click', onButtonSubmit);
    setVSCodeMessageListener();


    // Sets up an event listener to listen for messages passed from the extension context
    // and executes code based on the message that is recieved
    function setVSCodeMessageListener() {
        window.addEventListener("message", (event) => {
            const command = event.data.command;
            console.log('setVSCodeMessageListener: command =', command);
            const payload = JSON.parse(event.data.payload);
            switch (command) {
                case "setWorkflows":
                    console.log('setVSCodeMessageListener: setWorkflows');
                    setWorkflowDropDownValues(payload);
                    break;
                case "setWorkflowTriggers":
                    console.log('setVSCodeMessageListener: setWorkflowTriggers');
                    // console.log('setVSCodeMessageListener: payload = ', payload);
                    triggers = payload.workflowTriggers;
                    break;
            }
        });
    }

    function toggleSubmitButton() {
        submitButton.disabled = !(tenantDropDown.value && workflowDropDown.value && payloadTextarea.value && isJsonString(payloadTextarea.value));
    }

    // cf. https://stackoverflow.com/questions/3710204/how-to-check-if-a-string-is-a-valid-json-string
    function isJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    function onButtonSubmit(event) {
        vscode.postMessage({ 
            command: 'testWorkflow', 
            tenant: tenantDropDown.value,
            workflowId: workflowDropDown.value,
            workflowName: workflowDropDown.selectedOptions[0].text,
            payload: payloadTextarea.value
         });
    }
    /**
     * Requests the list of workflows when tenant is changed
     * @param {*} event 
     */
    function onTenantDropDownChange(event) {
        var tenant = event.target.value;
        if (tenant) {
            vscode.postMessage({ command: 'getWorkflows', tenant: tenant });
            vscode.postMessage({ command: 'getWorkflowTriggers', tenant: tenant });
        }
        toggleSubmitButton();
    }

    /**
     * Requests the list of workflows when workflow is changed
     * @param {*} event 
     */
    function onWorkflowDropDownChange(event) {
        console.log('> onWorkflowDropDownChange');
        var workflowId = event.target.value;
        console.log('onWorkflowDropDownChange - workflowId =', workflowId);

        if (workflowId && !payloadTextarea.value) {
            // continue if workflowId is not null && payload is not already set
            const workflow = workflows.find(w => w.id === workflowId);
            console.log('onWorkflowDropDownChange - workflow =', workflow);
            console.log('onWorkflowDropDownChange - triggers =', triggers);
            if (workflow && triggers) {
                var trigger = triggers.find(t => t.id === workflow.triggerAttributes.id && t.type === workflow.triggerType);
                if (trigger) {
                    payloadTextarea.value = JSON.stringify(trigger.inputExample, null, 2);
                }
            }
        }
        toggleSubmitButton();
    }

    function setWorkflowDropDownValues(payload) {
        var workflowDropDown = document.getElementById(WORKFLOW_DROPDOWN_ID);
        workflowDropDown.innerHTML = ''; //remove all options
        workflowDropDown.disabled = false;
        var opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "";


        workflowDropDown.appendChild(opt);
        workflows = payload.workflows;
        if (workflows && Array.isArray(workflows) && workflows.length > 0) {
            for (let index = 0; index < workflows.length; index++) {
                const workflow = workflows[index];
                opt = document.createElement("option");
                opt.value = workflow.id;
                opt.textContent = workflow.name;

                if (payload.selected && payload.selected === workflow.id) {
                    opt.selected = true;
                }

                workflowDropDown.appendChild(opt);
            }
        }
    }

}());


