import IServiceData from "../../../common/IServiceData.interface";

export default interface IAddPhoto extends IServiceData {
    name: string;
    file_path: string;
    player_id: number;
    agent_id: number;
}
