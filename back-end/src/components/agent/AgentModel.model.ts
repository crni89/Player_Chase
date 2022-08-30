import IModel from "../../common/IModel.inteface";
import PhotoModel from "../photo/PhotoModel.model";


export default class AgentModel implements IModel {
    agentId: number;
    email: string;
    passwordHash: string | null;
    name: string;
    surname: string;
    club: string;
    passwordResetCode: string | null;
    activationCode: string | null;
    isActive: boolean;

    photos?: PhotoModel[] = [];
}
