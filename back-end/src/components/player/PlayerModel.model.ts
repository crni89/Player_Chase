import IModel from "../../common/IModel.inteface";
import PhotoModel from "../photo/PhotoModel.model";
import VideoModel from '../video/VideoModel.model';

export default class PlayerModel implements IModel {
    playerId: number;
    categoryId: number;
    email: string;
    passwordHash: string | null;
    name: string;
    surname: string;
    isActive: boolean;
    activationCode: string | null;
    passwordResetCode: string | null;
    club: string;
    dob: string;
    height: string;
    weight: string;
    position: string;

    photos?: PhotoModel[] = [];
    videos?: VideoModel[] = [];
}
