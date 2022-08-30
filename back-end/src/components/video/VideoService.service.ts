import BaseService from "../../common/BaseService";
import IAdapterOptions from "../../common/IAdapterOptions.interface";
import IAddVideo from "./dto/IAddVideo.dto";
import VideoModel from "./VideoModel.model";

export interface IVideoAdapterOptions extends IAdapterOptions {

}

export default class VideoService extends BaseService<VideoModel, IVideoAdapterOptions> {
    tableName(): string {
        return "video";
    }

    protected adaptToModel(data: any, options: IVideoAdapterOptions): Promise<VideoModel> {
        return new Promise(resolve => {
            const video = new VideoModel();

            video.videoId  = +data?.video_id;
            video.name     = data?.name;
            video.filePath = data?.file_path;

            resolve(video);
        })
    }

    public async add(data: IAddVideo, options: IVideoAdapterOptions = {}): Promise<VideoModel> {
        return this.baseAdd(data, options);
    }

    public async getAllByPlayerId(playerId: number, options: IVideoAdapterOptions = {}): Promise<VideoModel[]> {
        return this.getAllByFieldNameAndValue("player_id", playerId, options);
    }

    public async deleteById(videoId: number): Promise<true> {
        return this.baseDeleteById(videoId);
    }
}
