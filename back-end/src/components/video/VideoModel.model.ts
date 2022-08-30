import IModel from "../../common/IModel.inteface";


export default class VideoModel implements IModel {
    videoId: number;
    name: string;
    filePath: string;
}
