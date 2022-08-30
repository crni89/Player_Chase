import * as express from 'express';
import IApplicationResources from './IApplicationResources.inteface';

export default interface IRouter {
    setupRoutes (application: express.Application, resources: IApplicationResources);
}
