import * as express from "express";
import IApplicationResources from "../../common/IApplicationResources.inteface";
import IRouter from "../../common/IRouter.interface";
import AuthController from "./AuthController.controller";

class AuthRouter implements IRouter {
    public setupRoutes(application: express.Application, resources: IApplicationResources) {
        const authController: AuthController = new AuthController(resources.services);

        application.post("/api/auth/agent/login",         authController.agentLogin.bind(authController));
        application.post("/api/auth/agent/refresh",       authController.agentRefresh.bind(authController));

        application.post("/api/auth/player/login",                  authController.playerLogin.bind(authController));
        application.post("/api/auth/player/refresh",                authController.playerRefresh.bind(authController));
    }
}

export default AuthRouter;
