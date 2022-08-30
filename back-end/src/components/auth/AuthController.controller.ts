import { Request, Response } from "express";
import BaseController from "../../common/BaseController";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import ITokenData from "./dto/ITokenData";
import { DevConfig } from "../../configs";
import AuthMiddleware from "../../middlewares/AuthMiddleware";
import { IAgentLoginDto } from './dto/IAgentLogin.dto';
import { IUserLoginDto } from "./dto/IPlayerLogin.dto";

export default class AuthController extends BaseController {
    public async agentLogin(req: Request, res: Response) {
        const data = req.body as IAgentLoginDto;

        this.services.agent.getByEmail(data.email)
        .then(result => {
            if (result === null) {
                throw {
                    status: 404,
                    message: "Agent account not found!"
                };
            }

            return result;
        })
        .then(agent => {
            if (!bcrypt.compareSync(data.password, agent.passwordHash)) {
                throw {
                    status: 404,
                    message: "Agent account not found!"
                };
            }

            return agent;
        })
        .then(agent => {
            if (!agent.isActive) {
                throw {
                    status: 404,
                    message: "Agent account is not active!"
                };
            }

            return agent;
        })
        .then(agent => {
            const tokenData: ITokenData = {
                role: "agent",
                id: agent.agentId,
                identity: agent.name + " " + agent.surname,
            };

            const authToken = jwt.sign(tokenData, DevConfig.auth.agent.tokens.auth.keys.private, {
                algorithm: DevConfig.auth.agent.algorithm,
                issuer: DevConfig.auth.agent.issuer,
                expiresIn: DevConfig.auth.agent.tokens.auth.duration,
            });

            const refreshToken = jwt.sign(tokenData, DevConfig.auth.agent.tokens.refresh.keys.private, {
                algorithm: DevConfig.auth.agent.algorithm,
                issuer: DevConfig.auth.agent.issuer,
                expiresIn: DevConfig.auth.agent.tokens.refresh.duration,
            });

            res.send({
                authToken: authToken,
                refreshToken: refreshToken,
                id: agent.agentId,
            });
        })
        .catch(error => {
            setTimeout(() => {
                res.status(error?.status ?? 500).send(error?.message);
            }, 1500);
        });
    }

    agentRefresh(req: Request, res: Response) {
        const refreshTokenHeader: string = req.headers?.authorization ?? ""; // "Bearer TOKEN"

        try {
            const tokenData = AuthMiddleware.validateTokenAs(refreshTokenHeader, "agent", "refresh");
    
            const authToken = jwt.sign(tokenData, DevConfig.auth.agent.tokens.auth.keys.private, {
                algorithm: DevConfig.auth.agent.algorithm,
                issuer: DevConfig.auth.agent.issuer,
                expiresIn: DevConfig.auth.agent.tokens.auth.duration,
            });
    
            res.send({
                authToken: authToken,
            });
        } catch (error) {
            res.status(error?.status ?? 500).send(error?.message);
        }
    }

    public async playerLogin(req: Request, res: Response) {
        const data = req.body as IUserLoginDto;

        this.services.player.getByEmail(data.email)
        .then(result => {
            if (result === null) {
                throw {
                    status: 404,
                    message: "Player account not found!"
                };
            }

            return result;
        })
        .then(player => {
            if (!bcrypt.compareSync(data.password, player.passwordHash)) {
                throw {
                    status: 404,
                    message: "Player account not found!"
                };
            }

            return player;
        })
        .then(player => {
            if (!player.isActive) {
                throw {
                    status: 404,
                    message: "Player account is not active!"
                };
            }

            return player;
        })
        .then(player => {
            const tokenData: ITokenData = {
                role: "player",
                id: player.playerId,
                identity: player.name + " " + player.surname,
            };

            const authToken = jwt.sign(tokenData, DevConfig.auth.player.tokens.auth.keys.private, {
                algorithm: DevConfig.auth.player.algorithm,
                issuer: DevConfig.auth.player.issuer,
                expiresIn: DevConfig.auth.player.tokens.auth.duration,
            });

            const refreshToken = jwt.sign(tokenData, DevConfig.auth.player.tokens.refresh.keys.private, {
                algorithm: DevConfig.auth.player.algorithm,
                issuer: DevConfig.auth.player.issuer,
                expiresIn: DevConfig.auth.player.tokens.refresh.duration,
            });

            res.send({
                authToken: authToken,
                refreshToken: refreshToken,
                id: player.playerId,
            });
        })
        .catch(error => {
            setTimeout(() => {
                res.status(error?.status ?? 500).send(error?.message);
            }, 1500);
        });
    }

    playerRefresh(req: Request, res: Response) {
        const refreshTokenHeader: string = req.headers?.authorization ?? ""; // "Bearer TOKEN"

        try {
            const tokenData = AuthMiddleware.validateTokenAs(refreshTokenHeader, "player", "refresh");
    
            const authToken = jwt.sign(tokenData, DevConfig.auth.player.tokens.auth.keys.private, {
                algorithm: DevConfig.auth.player.algorithm,
                issuer: DevConfig.auth.player.issuer,
                expiresIn: DevConfig.auth.player.tokens.auth.duration,
            });
    
            res.send({
                authToken: authToken,
            });
        } catch (error) {
            res.status(error?.status ?? 500).send(error?.message);
        }
    }
}
