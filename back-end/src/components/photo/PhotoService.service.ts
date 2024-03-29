import BaseService from "../../common/BaseService";
import IAdapterOptions from "../../common/IAdapterOptions.interface";
import IAddPhoto from "./dto/IAddPhoto.dto";
import PhotoModel from "./PhotoModel.model";

export interface IPhotoAdapterOptions extends IAdapterOptions {

}

export default class PhotoService extends BaseService<PhotoModel, IPhotoAdapterOptions> {
    tableName(): string {
        return "photo";
    }

    protected adaptToModel(data: any, options: IPhotoAdapterOptions): Promise<PhotoModel> {
        return new Promise(resolve => {
            const photo = new PhotoModel();

            photo.photoId  = +data?.photo_id;
            photo.name     = data?.name;
            photo.filePath = data?.file_path;

            resolve(photo);
        })
    }

    public async add(data: IAddPhoto, options: IPhotoAdapterOptions = {}): Promise<PhotoModel> {
        return this.baseAdd(data, options);
    }

    public async getAllByPlayerId(playerId: number, options: IPhotoAdapterOptions = {}): Promise<PhotoModel[]> {
        return this.getAllByFieldNameAndValue("player_id", playerId, options);
    }
    
    public async getAllByAgentId(agentId: number, options: IPhotoAdapterOptions = {}): Promise<PhotoModel[]> {
        return this.getAllByFieldNameAndValue("agent_id", agentId, options);
    }

    public async deleteById(photoId: number): Promise<true> {
        return this.baseDeleteById(photoId);
    }
}
