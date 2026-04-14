class Controller {
    constructor(instanceId) {
        this.instanceId = instanceId;
        this.model = new Model(this);
        this.view = new View(this);

        this.view.init();
    }
}
