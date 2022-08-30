import IServiceData from "../../../common/IServiceData.interface";

export default interface IAddVideo extends IServiceData {
    name: string;
    file_path: string;
    player_id: number;
}
