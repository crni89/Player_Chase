import { IServices } from "./IApplicationResources.inteface";

export default abstract class BaseController {
    private serviceInstances: IServices;

    constructor(services: IServices) {
        this.serviceInstances = services;
    }

    protected get services(): IServices {
        return this.serviceInstances;
    }
}