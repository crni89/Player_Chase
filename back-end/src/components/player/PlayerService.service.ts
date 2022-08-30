import BaseService from "../../common/BaseService";
import IAdapterOptions from "../../common/IAdapterOptions.interface";
import PlayerModel from './PlayerModel.model';
import { IAddPlayer } from './dto/IRegisterPlayer.dto';
import IEditPlayer from './dto/IEditPlayer.dto';

export interface IPlayerAdapterOptions extends IAdapterOptions {
    removePassword: boolean;
    removeActivationCode: boolean;
    loadPhotos: boolean,
    loadVideos: boolean,
}

export const DefaultPlayerAdapterOptions: IPlayerAdapterOptions = {
    removePassword: false,
    removeActivationCode: false,
    loadPhotos: false,
    loadVideos: false,
}

export default class PlayerService extends BaseService<PlayerModel, IPlayerAdapterOptions> {
    tableName(): string {
        return "player";
    }

    protected async adaptToModel(data: any, options: IPlayerAdapterOptions = DefaultPlayerAdapterOptions): Promise<PlayerModel> {
        const player = new PlayerModel();

        player.playerId         = +data?.player_id;
        player.categoryId       = data?.category_id;
        player.email            = data?.email;
        player.passwordHash     = data?.password_hash;
        player.name             = data?.name;
        player.surname          = data?.surname;
        player.club             = data?.club;
        player.dob              = data?.dob;
        player.weight           = data?.weight;
        player.height           = data?.height;
        player.position         = data?.position;
        player.isActive         = +data?.is_active === 1;
        player.activationCode   = data?.activation_code ? data?.activation_code : null;
        player.passwordResetCode = data?.password_reset_code ? data?.password_reset_code : null;

        if (options.removePassword) {
            player.passwordHash = null;
        }

        if (options.removeActivationCode) {
            player.activationCode = null;
        }

        if (options.loadPhotos) {
            player.photos = await this.services.photo.getAllByPlayerId(player.playerId);
        }

        if (options.loadVideos) {
            player.videos = await this.services.video.getAllByPlayerId(player.playerId);
        }

        return player;
    }

    public async getAllByCategoryId(categoryId: number, options: IPlayerAdapterOptions): Promise<PlayerModel[]> {
        return this.getAllByFieldNameAndValue('category_id', categoryId, options);
    }

    public async add(data: IAddPlayer): Promise<PlayerModel> {
        return this.baseAdd(data, {
            removeActivationCode: false,
            removePassword: true,
            loadPhotos: false,
            loadVideos: false,
        });
    }

    public async edit(id: number, data: IEditPlayer, options: IPlayerAdapterOptions = { 
                                                                                        removePassword: true, 
                                                                                        removeActivationCode: true, 
                                                                                        loadPhotos:false,
                                                                                        loadVideos: false,
                                                                                    }): Promise<PlayerModel> {
        return this.baseEditById(id, data, options);
    }

    public async getPlayerByActivateionCode(code: string, option: IPlayerAdapterOptions = DefaultPlayerAdapterOptions): Promise<PlayerModel|null> {
        return new Promise((resolve, reject) => {
            this.getAllByFieldNameAndValue("activation_code", code, option)
            .then(result => {
                if (result.length === 0) {
                    return resolve(null);
                }

                resolve(result[0]);
            })
            .catch(error => {
                reject(error?.message);
            });
        });
    }

    public async getPlayerByPasswordResetCode(code: string, option: IPlayerAdapterOptions = DefaultPlayerAdapterOptions): Promise<PlayerModel|null> {
        return new Promise((resolve, reject) => {
            this.getAllByFieldNameAndValue("password_reset_code", code, option)
            .then(result => {
                if (result.length === 0) {
                    return resolve(null);
                }

                resolve(result[0]);
            })
            .catch(error => {
                reject(error?.message);
            });
        });
    }

    public async getByEmail(email: string, option: IPlayerAdapterOptions = DefaultPlayerAdapterOptions): Promise<PlayerModel|null> {
        return new Promise((resolve, reject) => {
            this.getAllByFieldNameAndValue("email", email, option)
            .then(result => {
                if (result.length === 0) {
                    return resolve(null);
                }

                resolve(result[0]);
            })
            .catch(error => {
                reject(error?.message);
            });
        });
    }
}
