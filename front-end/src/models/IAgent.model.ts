import IPhoto from "./IPhoto.model";

export default interface IAgent {
    agentId: number;
    email: string;
    name: string;
    surname: string;
    club: string;
    passwordHash: string|null;
    isActive: boolean;
    activationCode: string|null;
    passwordResetCode: string|null;
    photos: IPhoto[];
}
