import * as mysql2 from "mysql2/promise";
import CategoryService from '../components/category/CategoryService.service';
import AgentService from '../components/agent/AgentService.service';
import PlayerService from '../components/player/PlayerService.service';
import PhotoService from '../components/photo/PhotoService.service';
import VideoService from '../components/video/VideoService.service';

export interface IServices {
    category: CategoryService;
    agent: AgentService;
    player: PlayerService;
    photo: PhotoService;
    video: VideoService;
}

export default interface IApplicationResources {
    databaseConnection: mysql2.Connection;
    services: IServices;
}
