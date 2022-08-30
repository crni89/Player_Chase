import * as express from "express";
import IApplicationResources from "../../common/IApplicationResources.inteface";
import IRouter from "../../common/IRouter.interface";
import AuthMiddleware from "../../middlewares/AuthMiddleware";
import AgentController from "./AgentController.controller";

class AgentRouter implements IRouter {
    public setupRoutes(application: express.Application, resources: IApplicationResources) {
        const agentController: AgentController = new AgentController(resources.services);

        application.get("/api/agent",                   agentController.getAll.bind(agentController));
        application.get("/api/agent/:id",               AuthMiddleware.getVerifier("agent") ,agentController.getById.bind(agentController));
        application.post("/api/agent/register",         agentController.register.bind(agentController));
        application.put("/api/agent/:aid",              AuthMiddleware.getVerifier("agent") ,agentController.editById.bind(agentController));
        application.get("/api/agent/activate/:code",    agentController.activate.bind(agentController));
        application.post("/api/agent/resetPassword",    agentController.passwordResetEmailSend.bind(agentController));
        application.get("/api/agent/reset/:code",       agentController.resetPassword.bind(agentController));
        application.post("/api/agent/:id/photo",        agentController.uploadPhoto.bind(agentController));
        application.delete("/api/agent/:id/photo/:pid", agentController.deletePhoto.bind(agentController));
    }
}

export default AgentRouter;
