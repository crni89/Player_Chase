import CategoryController from "./CategoryController.controller";
import * as express from 'express';
import IApplicationResources from '../../common/IApplicationResources.inteface';
import IRouter from "../../common/IRouter.interface";
import AuthMiddleware from "../../middlewares/AuthMiddleware";
import PlayerController from '../player/PlayerController.controller';

class CategoryRouter implements IRouter{
    public setupRoutes (application: express.Application, resources: IApplicationResources) {
        const categoryController: CategoryController = new CategoryController(resources.services);
        const playerController: PlayerController = new PlayerController(resources.services);

        //category
        application.get("/api/category",                categoryController.getAll.bind(categoryController));
        application.get("/api/category/:id",            categoryController.getById.bind(categoryController));
        application.post("/api/category",               categoryController.add.bind(categoryController));
        application.put("/api/category/:cid",           categoryController.edit.bind(categoryController));
        //player
        application.get("/api/category/:cid/player",                    playerController.getAll.bind(playerController));
        application.get("/api/category/:cid/player/:pid",               AuthMiddleware.getVerifier("player") ,playerController.getById.bind(playerController));
        application.post("/api/category/:cid/player/register",          playerController.register.bind(playerController));
        application.put("/api/category/:cid/player/:pid",               AuthMiddleware.getVerifier("player") ,playerController.editById.bind(playerController));
        application.get("/api/category/:cid/player/activate/:code",     playerController.activate.bind(playerController));
        application.post("/api/player/resetPassword",                   playerController.passwordResetEmailSend.bind(playerController));
        application.get("/api/player/reset/:code",                      playerController.resetPassword.bind(playerController));
        application.post("/api/category/:cid/player/:pid/photo",        playerController.uploadPhoto.bind(playerController));
        application.post("/api/category/:cid/player/:pid/video",        playerController.uploadVideo.bind(playerController));
        application.delete("/api/category/:cid/player/:id/photo/:pid",   playerController.deletePhoto.bind(playerController));
        application.delete("/api/category/:cid/player/:id/video/:vid",   playerController.deleteVideo.bind(playerController));
    }
}

export default CategoryRouter;
