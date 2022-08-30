import { Request, Response } from "express";
import BaseController from "../../common/BaseController";
import { IRegisterPlayerDto, RegisterPlayerValidator } from "./dto/IRegisterPlayer.dto";
import * as bcrypt from "bcrypt";
// import IEditPlayer, { EditPlayerValidator, IEditPlayerDto } from "./dto/IEditPlayer.dto";
import { EditPlayerValidator, IEditPlayerDto } from "../player/dto/IEditPlayer.dto";
import * as uuid from "uuid";
import PlayerModel from "./PlayerModel.model";
import * as nodemailer from "nodemailer";
import * as Mailer from "nodemailer/lib/mailer";
import { DevConfig } from "../../configs";
import { IPasswordResetDto, PasswordResetValidator } from './dto/IPasswordReset.dto';
import * as generatePassword from "generate-password";
import { DefaultPlayerAdapterOptions } from './PlayerService.service';
import PhotoModel from "../photo/PhotoModel.model";
import IConfig, { IResize } from "../../common/IConfig.interface";
import { mkdirSync, readFileSync, unlinkSync } from "fs";
import { extname, basename, dirname } from "path";
import { UploadedFile } from "express-fileupload";
import filetype from 'magic-bytes.js'
import sizeOf from "image-size";
import * as sharp from "sharp";
import VideoModel from '../video/VideoModel.model';

export default class PlayerController extends BaseController {
    getAll(req: Request, res: Response) {
        const categoryId: number = +req.params?.cid;

        this.services.category.getById(categoryId, {
            loadPlayers:false,
        })
        .then(result => {
            if (result === null) {
                return res.status(404).send("Category not found!");
            }

            this.services.player.getAllByCategoryId(categoryId, {
                loadPhotos:true,
                loadVideos:true,
                removeActivationCode:false,
                removePassword:false,
            })
            .then(result => {
                res.send(result);
            })
            .catch(error => {
                res.status(500).send(error?.message);
            });
        })
        .catch(error => {
            res.status(500).send(error?.message);
        });
    }

    getById(req: Request, res: Response) {
        const categoryId: number = +req.params?.cid;
        const playerId: number = +req.params?.pid;
        
        if (req.authorisation?.role === "player") {
            if (req.authorisation?.id !== playerId) {
                return res.status(403).send("You do not have access to this resource!");
            }
        }

        this.services.category.getById(categoryId, { loadPlayers: false })
        .then(result => {
            if (result === null) {
                return res.status(404).send("Category not found!");
            }

            this.services.player.getById(playerId, {
                loadPhotos:true,
                loadVideos:true,
                removeActivationCode:false,
                removePassword:false,
            })
            .then(result => {
                if (result === null) {
                    return res.status(404).send("Player not found!");
                }

                if (result.categoryId !== categoryId) {
                    return res.status(404).send("Player not found for this sport!");
                }

                res.send(result);
            })
            .catch(error => {
                res.status(500).send(error?.message);
            });
        })
        .catch(error => {
            res.status(500).send(error?.message);
        });
    }

    register(req: Request, res: Response) {
        const categoryId: number = +req.params?.cid;
        const body = req.body as IRegisterPlayerDto;

        if (!RegisterPlayerValidator(body)) {
            return res.status(400).send(RegisterPlayerValidator.errors);
        }

        this.services.category.getById(categoryId, { loadPlayers: false })
        .then(result => {
            if (result === null) {
                throw {
                    status: 404,
                    message: 'Player not found!',
                }
            }
        })

        const passwordHash = bcrypt.hashSync(body.password, 10);

        this.services.player.startTransaction()
        .then(() => {
            return this.services.player.add({
                email: body.email,
                password_hash: passwordHash,
                name: body.name,
                surname: body.surname,
                club: body.club,
                dob: body.dob,
                weight: body.weight,
                height: body.height,
                position: body.position,
                activation_code: uuid.v4(),
                category_id: categoryId
            });
        })        
        .then(player => {
            return this.sendRegistrationEmail(player);
        })
        .then(async player => {
            await this.services.player.commitChanges();
            return player;
        })
        .then(player => {
            player.activationCode = null;
            res.send(player);
        })
        .catch(async error => {
            await this.services.player.rollbackChanges();
            res.status(500).send(error?.message);
        });
    }

    private async sendRegistrationEmail(player: PlayerModel): Promise<PlayerModel> {
        return new Promise((resolve, reject) => {
            const transport = this.getMailTransport();

            const mailOptions: Mailer.Options = {
                to: player.email,
                subject: "Account registration",
                html: `<!doctype html>
                        <html>
                            <head><meta charset="utf-8"></head>
                            <body>
                                <p>
                                    Dear ${ player.name } ${ player.surname },<br>
                                    Your account was successfully created.
                                </p>
                                <p>
                                    You must activate you account by clicking on the following link:
                                </p>
                                <p style="text-align: center; padding: 10px;">
                                    <a href="http://localhost:10000/api/category/:cid/user/activate/${ player.activationCode }">Activate</a>
                                </p>
                            </body>
                        </html>`
            };

            transport.sendMail(mailOptions)
            .then(() => {
                transport.close();

                player.activationCode = null;

                resolve(player);
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

        this.services.player.getByEmail(data.email, {
            removeActivationCode: false,
            removePassword: true,
            loadPhotos: false,
            loadVideos: false
        })
        .then(result => {
            if (result === null) {
                throw {
                    status: 404,
                    message: "Player not found!",
                }
            }

            return result;
        })
        .then(player => {
            if (!player.isActive && !player.activationCode) {
                throw {
                    status: 403,
                    message: "Your account has been deactivated by the administrator!",
                }
            }

            return player;
        })
        .then(player => {
            const code = uuid.v4() + "-" + uuid.v4();

            return this.services.player.edit(
                player.playerId,
                {
                    password_reset_code: code,
                },
                {
                    removeActivationCode: true,
                    removePassword: true,
                    loadPhotos: false,
                    loadVideos: false
                },
            );
        })
        .then(player => {
            return this.sendRecoveryEmail(player);
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

        this.services.player.getPlayerByActivateionCode(code, {
            removeActivationCode: true,
            removePassword: true,
            loadPhotos: false,
            loadVideos: false,
        })
        .then(result => {
            if (result === null) {
                throw {
                    status: 404,
                    message: "Player not found!",
                }
            }

            return result;
        })
        .then(result => {
            const player = result as PlayerModel;

            return this.services.player.edit(player.playerId, {
                is_active: 1,
                activation_code: null,
            });
        })
        .then(player => {
            return this.sendActivationEmail(player);
        })
        .then(player => {
            res.send(player);
        })
        .catch(error => {
            setTimeout(() => {
                res.status(error?.status ?? 500).send(error?.message);
            }, 500);
        });
    }

    resetPassword(req: Request, res: Response) {
        const code: string = req.params?.code;

        this.services.player.getPlayerByPasswordResetCode(code, {
            removeActivationCode: false,
            removePassword: true,
            loadPhotos:false,
            loadVideos:false
        })
        .then(result => {
            if (result === null) {
                throw {
                    status: 404,
                    message: "Player not found!",
                }
            }

            return result;
        })
        .then(player => {
            if (!player.isActive && !player.activationCode) {
                throw {
                    status: 403,
                    message: "Your account has been deactivated by the administrator",
                };
            }

            return player;
        })
        .then(player => {
            const newPassword = generatePassword.generate({
                numbers: true,
                uppercase: true,
                lowercase: true,
                symbols: false,
                length: 18,
            });

            const passwordHash = bcrypt.hashSync(newPassword, 10);

            return new Promise<{player: PlayerModel, newPassword: string}>(resolve => {
                this.services.player.edit(
                    player.playerId,
                    {
                        password_hash: passwordHash,
                        password_reset_code: null,
                    },
                    {
                        removeActivationCode: true,
                        removePassword: true,
                        loadPhotos:false,
                        loadVideos:false
                    }
                )
                .then(player => {
                    return this.sendNewPassword(player, newPassword);
                })
                .then(player => {
                    resolve({
                        player: player,
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

    private async sendActivationEmail(player: PlayerModel): Promise<PlayerModel> {
        return new Promise((resolve, reject) => {
            const transport = this.getMailTransport();

            const mailOptions: Mailer.Options = {
                to: player.email,
                subject: "Account activation",
                html: `<!doctype html>
                        <html>
                            <head><meta charset="utf-8"></head>
                            <body>
                                <p>
                                    Dear ${ player.name } ${ player.surname },<br>
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

                player.activationCode = null;
                // player.passwordResetCode = null;

                resolve(player);
            })
            .catch(error => {
                transport.close();

                reject({
                    message: error?.message,
                });
            });
        });
    }

    private async sendNewPassword(player: PlayerModel, newPassword: string): Promise<PlayerModel> {
        return new Promise((resolve, reject) => {
            const transport = this.getMailTransport();

            const mailOptions: Mailer.Options = {
                to: player.email,
                subject: "New password",
                html: `<!doctype html>
                        <html>
                            <head><meta charset="utf-8"></head>
                            <body>
                                <p>
                                    Dear ${ player.name } ${ player.surname },<br>
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

                player.activationCode = null;
                player.passwordResetCode = null;

                resolve(player);
            })
            .catch(error => {
                transport.close();

                reject({
                    message: error?.message,
                });
            });
        });
    }

    private async sendRecoveryEmail(player: PlayerModel): Promise<PlayerModel> {
        return new Promise((resolve, reject) => {
            const transport = this.getMailTransport();

            const mailOptions: Mailer.Options = {
                to: player.email,
                subject: "Account password reset code",
                html: `<!doctype html>
                        <html>
                            <head><meta charset="utf-8"></head>
                            <body>
                                <p>
                                    Dear ${ player.name } ${ player.surname },<br>
                                    Here is a link you can use to reset your account:
                                </p>
                                <p>
                                    <a href="http://localhost:10000/api/category/:cid/user/reset/${ player.passwordResetCode }"
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

                player.activationCode = null;
                player.passwordResetCode = null;

                resolve(player);
            })
            .catch(error => {
                transport.close();

                reject({
                    message: error?.message,
                });
            });
        });
    }

    async editById(req: Request, res: Response) {
        const categoryId: number       = +req.params?.cid;
        const playerId: number     = +req.params?.pid;
        const data: IEditPlayerDto =  req.body as IEditPlayerDto;

        if (!EditPlayerValidator(data)) {
            return res.status(400).send(EditPlayerValidator.errors);
        }

        this.services.category.getById(categoryId, { loadPlayers: false })
        .then(result => {
            if (result === null) {
                throw {
                    status: 404,
                    message: 'Category not found!',
                }
            }
        })
        .then(() => {
            return this.services.player.getById(playerId, DefaultPlayerAdapterOptions);
        })
        .then(result => {
            if (result === null) {
                throw {
                    status: 404,
                    message: 'Player not found!',
                }
            }

            if (result.categoryId !== categoryId) {
                throw {
                    status: 400,
                    message: 'This player does not belong for this sport!',
                }
            }
        })
        .then(() => {
            return this.services.player.edit(playerId, data)
        })
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            res.status(error?.status ?? 500).send(error?.message);
        });
    }

    async uploadPhoto(req: Request, res: Response) {
        const categoryId: number = +req.params?.cid;
        const playerId: number = +req.params?.pid;

        this.services.category.getById(categoryId, { loadPlayers: false })
        .then(result => {
            if (result === null) throw {
                code: 400,
                message: "Category not found!",
            };

            return result;
        })
        .then(() => {
            return this.services.player.getById(playerId, DefaultPlayerAdapterOptions);
        })
        .then(result => {
            if (result === null) throw {
                code: 404,
                message: "Player not found!",
            };

            if (result.categoryId !== categoryId) throw {
                code: 404,
                message: "PLayer not found for this sport!",
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
                    player_id: playerId,
                    agent_id: null,
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
    
    async uploadVideo(req: Request, res: Response) {
        const categoryId: number = +req.params?.cid;
        const playerId: number = +req.params?.pid;

        this.services.category.getById(categoryId, { loadPlayers: false })
        .then(result => {
            if (result === null) throw {
                code: 400,
                message: "Category not found!",
            };

            return result;
        })
        .then(() => {
            return this.services.player.getById(playerId, DefaultPlayerAdapterOptions);
        })
        .then(result => {
            if (result === null) throw {
                code: 404,
                message: "Player not found!",
            };

            if (result.categoryId !== categoryId) throw {
                code: 404,
                message: "PLayer not found for this sport!",
            };

            return this.doVideoUpoload(req);
        })
        .then(async uploadedFiles => {
            const videos: VideoModel[] = [];

            for (let singleFile of await uploadedFiles) {
                const filename = basename(singleFile);

                const video = await this.services.video.add({
                    name: filename,
                    file_path: singleFile,
                    player_id: playerId,
                });

                if (video === null) {
                    throw {
                        code: 500,
                        message: "Failed to add this video into the database!",
                    };
                }

                videos.push(video);
            }

            res.send(videos);
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

    private async doVideoUpoload(req: Request): Promise<string[] | null> {
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

            if (!config.fileUploads.videos.allowedTypes.includes(type)) {
                unlinkSync(file.tempFilePath);
                throw {
                    code: 415,
                    message: `File ${fileFieldName} - type is not supported!`,
                };
            }

            file.name = file.name.toLocaleLowerCase();

            const declaredExtension = extname(file.name);

            if (!config.fileUploads.videos.allowedExtensions.includes(declaredExtension)) {
                unlinkSync(file.tempFilePath);
                throw {
                    code: 415,
                    message: `File ${fileFieldName} - extension is not supported!`,
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
        const categoryId: number = +(req.params?.cid);
        const playerId: number = +(req.params?.id);
        const photoId: number = +(req.params?.pid);

        this.services.category.getById(categoryId, {loadPlayers:false})
        .then(result => {
            if (result === null) throw { status: 404, message: "Category not found!" };
            return result;
        })
        .then(async category => {
            return {
                category: category,
                player: await this.services.player.getById(playerId, {
                    loadPhotos: true,
                    loadVideos: true,
                    removeActivationCode: false,
                    removePassword: false,
                }),
            };
        })
        .then( ({ category, player }) => {
            if (player === null) throw { status: 404, message: "Player not found!" };
            if (player.categoryId !== category.categoryId) throw { status: 404, message: "PLayer not found for this sport!" };
            return player;
        })
        .then(player => {
            const photo = player.photos?.find(photo => photo.photoId === photoId);
            if (!photo) throw { status: 404, message: "Photo not found for this player!" };
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

    async deleteVideo(req: Request, res: Response) {
        const categoryId: number = +(req.params?.cid);
        const playerId: number = +(req.params?.id);
        const videoId: number = +(req.params?.vid);

        this.services.category.getById(categoryId, {loadPlayers:false})
        .then(result => {
            if (result === null) throw { status: 404, message: "Category not found!" };
            return result;
        })
        .then(async category => {
            return {
                category: category,
                player: await this.services.player.getById(playerId, {
                    loadPhotos: true,
                    loadVideos: true,
                    removeActivationCode: false,
                    removePassword: false,
                }),
            };
        })
        .then( ({ category, player }) => {
            if (player === null) throw { status: 404, message: "Player not found!" };
            if (player.categoryId !== category.categoryId) throw { status: 404, message: "PLayer not found for this sport!" };
            return player;
        })
        .then(player => {
            const video = player.videos?.find(video => video.videoId === videoId);
            if (!video) throw { status: 404, message: "Video not found for this player!" };
            return video;
        })
        .then(async video => {
            await this.services.video.deleteById(video.videoId);
            return video;
        })
        .then(video => {
            const directoryPart = DevConfig.server.static.path + "/" + dirname(video.filePath);
            const fileName      = basename(video.filePath);

            unlinkSync( DevConfig.server.static.path + "/" + video.filePath);

            res.send("Deleted!");
        })
        .catch(error => {
            res.status(error?.status ?? 500).send(error?.message ?? "Server side error!");
        });
    }
}
