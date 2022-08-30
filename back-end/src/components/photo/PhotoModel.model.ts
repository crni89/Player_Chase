import IModel from "../../common/IModel.inteface";


export default class PhotoModel implements IModel {
    photoId: number;
    name: string;
    filePath: string;
}
