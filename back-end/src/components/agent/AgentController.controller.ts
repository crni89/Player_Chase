
import { Request, Response } from "express";
import BaseController from "../../common/BaseController";
import * as bcrypt from "bcrypt";
import * as uuid from "uuid";
import * as nodemailer from "nodemailer";
import * as Mailer from "nodemailer/lib/mailer";
import { DevConfig } from "../../configs";
import * as generatePassword from "generate-password";
import { IRegisterAgentDto, RegisterAgentValidator } from "./dto/IRegisterAgent.dto";
import AgentModel from "./AgentModel.model";
import { IPasswordResetDto, PasswordResetValidator } from "./dto/IPasswordReset.dto";
import IEditAgent, { EditAgentValidator, IEditAgentDto } from "./dto/IEditAgent.dto";
import IConfig, { IResize } from "../../common/IConfig.interface";
import { mkdirSync, readFileSync, unlinkSync } from "fs";
import { extname, basename, dirname } from "path";
import { UploadedFile } from "express-fileupload";
import filetype from 'magic-bytes.js'
import sizeOf from "image-size";
import * as sharp from "sharp";
import PhotoModel from "../photo/PhotoModel.model";
import { DefaultAgentAdapterOptions } from './AgentService.service';
import VideoModel from '../video/VideoModel.model';

export default class AgentController extends BaseController {

    getAll(req: Request, res: Response) {
        this.services.agent.getAll({
            removePassword: true,
            removeActivationCode: true,
            loadPhotos: true,
        })
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            res.status(500).send(error?.message);
        });
    }

    getById(req: Request, res: Response) {
        const id: number = +req.params?.id;

        if (req.authorisation?.role === "agent") {
            if (req.authorisation?.id !== id) {
                return res.status(403).send("You do not have access to this resource!");
            }
        }

        this.services.agent.getById(id, {
            removePassword: true,
            removeActivationCode: true,
            loadPhotos: true,
        })
        .then(result => {
            if (result === null) {
                res.status(404).send('Agent not found!');
            }
    
            res.send(result);
        })
        .catch(error => {
            res.status(500).send(error?.message);
        });
    }

    register(req: Request, res: Response) {
        const body = req.body as IRegisterAgentDto;

        if (!RegisterAgentValidator(body)) {
            return res.status(400).send(RegisterAgentValidator.errors);
        }

        const passwordHash = bcrypt.hashSync(body.password, 10);

        this.services.agent.startTransaction()
        .then(() => {
            return this.services.agent.add({
                email: body.email,
                password_hash: passwordHash,
                name: body.name,
                surname: body.surname,
                club: body.club,
                activation_code: uuid.v4(),
            });
        })        
        .then(agent => {
            return this.sendRegistrationEmail(agent);
        })
        .then(async agent => {
            await this.services.agent.commitChanges();
            return agent;
        })
        .then(agent => {
            agent.activationCode = null;
            res.send(agent);
        })
        .catch(async error => {
            await this.services.agent.rollbackChanges();
            res.status(500).send(error?.message);
        });
    }

    private async sendRegistrationEmail(agent: AgentModel): Promise<AgentModel> {
        return new Promise((resolve, reject) => {
            const transport = this.getMailTransport();

            const mailOptions: Mailer.Options = {
                to: agent.email,
                subject: "Account registration",
                html: `<!doctype html>
                        <html>
                            <head><meta charset="utf-8"></head>
                            <body>
                                <p>
                                    Dear ${ agent.name } ${ agent.surname },<br>
                                    Your account was successfully created.
                                </p>
                                <p>
                                    You must activate you account by clicking on the following link:
                                </p>
                                <p style="text-align: center; padding: 10px;">
                                    <a href="http://localhost:10000/api/user/activate/${ agent.activationCode }">Activate</a>
                                </p>
                            </body>
                        </html>`
            };

            transport.sendMail(mailOptions)
            .then(() => {
                transport.close();

                agent.activationCode = null;

                resolve(agent);
            })
            .catch(error => {
                transport.close();

                reject({
                    message: error?.message,
                });
            });
        });
    }

    passwordResetEmailSend(req: Request, res: Response) {
        const data = req.body as IPasswordResetDto;

        if (!PasswordResetValidator(data)) {
            return res.status(400).send(PasswordResetValidator.errors);
        }

        this.services.agent.getByEmail(data.email, {
            removeActivationCode: false,
            removePassword: true,
            loadPhotos:false,
        })
        .then(result => {
            if (result === null) {
                throw {
                    status: 404,
                    message: "Agent not found!",
                }
            }

            return result;
        })
        .then(agent => {
            if (!agent.isActive && !agent.activationCode) {
                throw {
                    status: 403,
                    message: "Your account has been deactivated by the administrator!",
                }
            }

            return agent;
        })
        .then(agent => {
            const code = uuid.v4() + "-" + uuid.v4();

            return this.services.agent.edit(
                agent.agentId,
                {
                    password_reset_code: code,
                },
                {
                    removeActivationCode: true,
                    removePassword: true,
                    loadPhotos:false,
                },
            );
        })
        .then(agent => {
            return this.sendRecoveryEmail(agent);
        })
        .then(() => {
            res.send({
                message: "Sent"
            });
        })
        .catch(error => {
            setTimeout(() => {
                res.status(error?.status ?? 500).send(error?.message);
            }, 500);
        });
    }

    activate(req: Request, res: Response) {
        const code: string = req.params?.code;

        this.services.agent.getAgentByActivateionCode(code, {
            removeActivationCode: true,
            removePassword: true,
            loadPhotos:false,
        })
        .then(result => {
            if (result === null) {
                throw {
                    status: 404,
                    message: "Agent not found!",
                }
            }

            return result;
        })
        .then(result => {
            const agent = result as AgentModel;

            return this.services.agent.edit(agent.agentId, {
                is_active: 1,
                activation_code: null,
            });
        })
        .then(agent => {
            return this.sendActivationEmail(agent);
        })
        .then(agent => {
            res.send(agent);
        })
        .catch(error => {
            setTimeout(() => {
                res.status(error?.status ?? 500).send(error?.message);
            }, 500);
        });
    }

    resetPassword(req: Request, res: Response) {
        const code: string = req.params?.code;

        this.services.agent.getAgentByPasswordResetCode(code, {
            removeActivationCode: false,
            removePassword: true,
            loadPhotos:false,
        })
        .then(result => {
            if (result === null) {
                throw {
                    status: 404,
                    message: "Agent not found!",
                }
            }

            return result;
        })
        .then(agent => {
            if (!agent.isActive && !agent.activationCode) {
                throw {
                    status: 403,
                    message: "Your account has been deactivated by the administrator",
                };
            }

            return agent;
        })
        .then(agent => {
            const newPassword = generatePassword.generate({
                numbers: true,
                uppercase: true,
                lowercase: true,
                symbols: false,
                length: 18,
            });

            const passwordHash = bcrypt.hashSync(newPassword, 10);

            return new Promise<{agent: AgentModel, newPassword: string}>(resolve => {
                this.services.agent.edit(
                    agent.agentId,
                    {
                        password_hash: passwordHash,
                        password_reset_code: null,
                    },
                    {
                        removeActivationCode: true,
                        removePassword: true,
                        loadPhotos: false,
                    }
                )
                .then(agent => {
                    return this.sendNewPassword(agent, newPassword);
                })
                .then(agent => {
                    resolve({
                        agent: agent,
                        newPassword: newPassword,
                    });
                })
                .catch(error => {
                    throw error;
                });
            });
        })
        .then(() => {
            res.send({
                message: 'Sent!',
            });
        })
        .catch(error => {
            setTimeout(() => {
                res.status(error?.status ?? 500).send(error?.message);
            }, 500);
        });
    }

    private getMailTransport() {
        return nodemailer.createTransport(
            {
                host: DevConfig.mail.host,
                port: DevConfig.mail.port,
                secure: false,
                tls: {
                    ciphers: "SSLv3",
                },
                debug: DevConfig.mail.debug,
                auth: {
                    user: DevConfig.mail.email,
                    pass: DevConfig.mail.password,
                },
            },
            {
                from: DevConfig.mail.email,
            },
        );
    }

    private async sendActivationEmail(agent: AgentModel): Promise<AgentModel> {
        return new Promise((resolve, reject) => {
            const transport = this.getMailTransport();

            const mailOptions: Mailer.Options = {
                to: agent.email,
                subject: "Account activation",
                html: `<!doctype html>
                        <html>
                            <head><meta charset="utf-8"></head>
                            <body>
                                <p>
                                    Dear ${ agent.name } ${ agent.surname },<br>
                                    Your account was successfully activated.
                                </p>
                                <p>
                                    You can now log into your account using the login form.
                                </p>
                            </body>
                        </html>`
            };

            transport.sendMail(mailOptions)
            .then(() => {
                transport.close();

                agent.activationCode = null;
                // agent.passwordResetCode = null;

                resolve(agent);
            })
            .catch(error => {
                transport.close();

                reject({
                    message: error?.message,
                });
            });
        });
    }

    private async sendNewPassword(agent: AgentModel, newPassword: string): Promise<AgentModel> {
        return new Promise((resolve, reject) => {
            const transport = this.getMailTransport();

            const mailOptions: Mailer.Options = {
                to: agent.email,
                subject: "New password",
                html: `<!doctype html>
                        <html>
                            <head><meta charset="utf-8"></head>
                            <body>
                                <p>
                                    Dear ${ agent.name } ${ agent.surname },<br>
                                    Your account password was successfully reset.
                                </p>
                                <p>
                                    Your new password is:<br>
                                    <pre style="padding: 20px; font-size: 24pt; color: #000; background-color: #eee; border: 1px solid #666;">${ newPassword }</pre>
                                </p>
                                <p>
                                    You can now log into your account using the login form.
                                </p>
                            </body>
                        </html>`
            };

            transport.sendMail(mailOptions)
            .then(() => {
                transport.close();

                agent.activationCode = null;
                agent.passwordResetCode = null;

                resolve(agent);
            })
            .catch(error => {
                transport.close();

                reject({
                    message: error?.message,
                });
            });
        });
    }

    private async sendRecoveryEmail(agent: AgentModel): Promise<AgentModel> {
        return new Promise((resolve, reject) => {
            const transport = this.getMailTransport();

            const mailOptions: Mailer.Options = {
                to: agent.email,
                subject: "Account password reset code",
                html: `<!doctype html>
                        <html>
                            <head><meta charset="utf-8"></head>
                            <body>
                                <p>
                                    Dear ${ agent.name } ${ agent.surname },<br>
                                    Here is a link you can use to reset your account:
                                </p>
                                <p>
                                    <a href="http://localhost:10000/api/user/reset/${ agent.passwordResetCode }"
                                        sryle="display: inline-block; padding: 10px 20px; color: #fff; background-color: #db0002; text-decoration: none;">
                                        Click here to reset your account
                                    </a>
                                </p>
                            </body>
                        </html>`
            };

            transport.sendMail(mailOptions)
            .then(() => {
                transport.close();

                agent.activationCode = null;
                agent.passwordResetCode = null;

                resolve(agent);
            })
            .catch(error => {
                transport.close();

                reject({
                    message: error?.message,
                });
            });
        });
    }

    editById(req: Request, res: Response) {
        const id: number = +req.params?.aid;
        const data = req.body as IEditAgentDto;

        if (req.authorisation?.role === "player") {
            if (req.authorisation?.id !== id) {
                return res.status(403).send("You do not have access to this resource!");
            }
        }

        if (!EditAgentValidator(data)) {
            return res.status(400).send(EditAgentValidator.errors);
        }

        const serviceData: IEditAgent = { };

        if (data.password !== undefined) {
            const passwordHash = bcrypt.hashSync(data.password, 10);
            serviceData.password_hash = passwordHash;
        }

        // if (DevConfig.auth.allowAllRoutesWithoutAuthTokens || req.authorisation?.role === "administrator") {
        //     if (data.isActive !== undefined) {
        //         serviceData.is_active = data.isActive ? 1 : 0;
        //     }
        // }

        if (data.name !== undefined) {
            serviceData.name = data.name;
        }

        if (data.surname !== undefined) {
            serviceData.surname = data.surname;
        }

        if (data.club !== undefined) {
            serviceData.club = data.club;
        }

        this.services.agent.edit(id, serviceData)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            res.status(500).send(error?.message);
        });
    }

    async uploadPhoto(req: Request, res: Response) {
        const id: number = +req.params?.id;

        this.services.agent.getById(id, DefaultAgentAdapterOptions)
        .then(result => {
            if (result === null) throw {
                code: 400,
                message: "Agent not found!",
            };

            return this.doFileUpload(req);
        })
        .then(async uploadedFiles => {
            const photos: PhotoModel[] = [];

            for (let singleFile of await uploadedFiles) {
                const filename = basename(singleFile);

                const photo = await this.services.photo.add({
                    name: filename,
                    file_path: singleFile,
                    player_id: null,
                    agent_id: id,
                });

                if (photo === null) {
                    throw {
                        code: 500,
                        message: "Failed to add this photo into the database!",
                    };
                }

                photos.push(photo);
            }

            res.send(photos);
        })
        .catch(error => {
            res.status(error?.code).send(error?.message);
        });
    }

    private async doFileUpload(req: Request): Promise<string[] | null> {
        const config: IConfig = DevConfig;

        if (!req.files || Object.keys(req.files).length === 0) throw {
            code: 400,
            message: "No file were uploaded!",
        };

        const fileFieldNames = Object.keys(req.files);

        const now = new Date();
        const year = now.getFullYear();
        const month = ((now.getMonth() + 1) + "").padStart(2, "0");

        const uploadDestinationRoot = config.server.static.path + "/";
        const destinationDirectory  = config.fileUploads.destinationDirectoryRoot + year + "/" + month + "/";

        mkdirSync(uploadDestinationRoot + destinationDirectory, {
            recursive: true,
            mode: "755",
        });

        const uploadedFiles = [];

        for (let fileFieldName of fileFieldNames) {
            const file = req.files[fileFieldName] as UploadedFile;

            const type = filetype(readFileSync(file.tempFilePath))[0]?.typename;

            if (!config.fileUploads.photos.allowedTypes.includes(type)) {
                unlinkSync(file.tempFilePath);
                throw {
                    code: 415,
                    message: `File ${fileFieldName} - type is not supported!`,
                };
            }

            file.name = file.name.toLocaleLowerCase();

            const declaredExtension = extname(file.name);

            if (!config.fileUploads.photos.allowedExtensions.includes(declaredExtension)) {
                unlinkSync(file.tempFilePath);
                throw {
                    code: 415,
                    message: `File ${fileFieldName} - extension is not supported!`,
                };
            }

            const size = sizeOf(file.tempFilePath);

            if ( size.width < config.fileUploads.photos.width.min || size.width > config.fileUploads.photos.width.max ) {
                unlinkSync(file.tempFilePath);
                throw {
                    code: 415,
                    message: `File ${fileFieldName} - image width is not supported!`,
                };
            }

            if ( size.height < config.fileUploads.photos.height.min || size.height > config.fileUploads.photos.height.max ) {
                unlinkSync(file.tempFilePath);
                throw {
                    code: 415,
                    message: `File ${fileFieldName} - image height is not supported!`,
                };
            }

            const fileNameRandomPart = uuid.v4();

            const fileDestinationPath = uploadDestinationRoot + destinationDirectory + fileNameRandomPart + "-" + file.name;

            file.mv(fileDestinationPath, async error => {
                if (error) {
                    throw {
                        code: 500,
                        message: `File ${fileFieldName} - could not be saved on the server!`,
                    };
                }

                for (let resizeOptions of config.fileUploads.photos.resize) {
                    await this.createResizedPhotos(destinationDirectory, fileNameRandomPart + "-" + file.name, resizeOptions);
                }
            });

            uploadedFiles.push(destinationDirectory + fileNameRandomPart + "-" + file.name);
        }

        return uploadedFiles;
    }

    private async createResizedPhotos(directory: string, filename: string, resizeOptions: IResize) {
        const config: IConfig = DevConfig;

        await sharp(config.server.static.path + "/" + directory + filename)
        .resize({
            width: resizeOptions.width,
            height: resizeOptions.height,
            fit: resizeOptions.fit,
            background: resizeOptions.defaultBackground,
            withoutEnlargement: true,
        })
        .toFile(config.server.static.path + "/" + directory + resizeOptions.prefix + filename);
    }

    async deletePhoto(req: Request, res: Response) {
        const agentId: number = +(req.params?.id);
        const photoId: number = +(req.params?.pid);

        this.services.agent.getById(agentId, {
            loadPhotos: true,
            removePassword: false,
            removeActivationCode: false
        })
        .then(agent => {
            if (agent === null) throw { status: 404, message: "Agent not found!" };
            return agent;
        })
        .then(agent => {
            const photo = agent.photos?.find(photo => photo.photoId === photoId);
            if (!photo) throw { status: 404, message: "Photo not found for this agent!" };
            return photo;
        })
        .then(async photo => {
            await this.services.photo.deleteById(photo.photoId);
            return photo;
        })
        .then(photo => {
            const directoryPart = DevConfig.server.static.path + "/" + dirname(photo.filePath);
            const fileName      = basename(photo.filePath);

            for (let resize of DevConfig.fileUploads.photos.resize) {
                const filePath = directoryPart + "/" + resize.prefix + fileName;
                unlinkSync(filePath);
            }

            unlinkSync( DevConfig.server.static.path + "/" + photo.filePath);

            res.send("Deleted!");
        })
        .catch(error => {
            res.status(error?.status ?? 500).send(error?.message ?? "Server side error!");
        });
    }
}
