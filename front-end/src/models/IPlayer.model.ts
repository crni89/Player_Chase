import IPhoto from "./IPhoto.model";
import IVideo from './IVideo.model';

export default interface IPlayer {
    playerId: number;
    email: string;
    name: string;
    surname: string;
    club: string;
    dob: string;
    height: string;
    weight: string;
    position: string;
    passwordHash: string|null;
    isActive: boolean;
    activationCode: string|null;
    passwordResetCode: string|null;
    photos: IPhoto[];
    videos: IVideo[];
}
