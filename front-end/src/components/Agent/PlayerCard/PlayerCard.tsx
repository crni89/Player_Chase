import path from 'path-browserify';
import React from 'react'
import { Link, useParams } from 'react-router-dom';
import { Config } from '../../../config';
import IPlayer from '../../../models/IPlayer.model';
import "./PlayerCard.css";

export interface IPlayerCardUrlParams extends Record<string, string | undefined> {
  cid: string
}

export interface IPlayerPreviewProperties {
    player: IPlayer;
    categoryId?: number;
}

export default function PlayerCard(props: IPlayerPreviewProperties) {

    const params = useParams<IPlayerCardUrlParams>();
    const categoryId = props?.categoryId ?? params.cid;

    function getPlayerPhotoUrl() {
      if (props.player.photos.length === 0) {
          return "PLACEHOLDER";
      }

      const fullFilePath = props.player.photos[0].filePath;

      const directory = path.dirname(fullFilePath);
      const filename  = path.basename(fullFilePath);
      const prefix    = 'small-';

      return Config.API_PATH + "/assets/" + directory + '/' + prefix + filename;

    }

  return (
    <Link to={"/api/category/" + categoryId + "/player/" + props.player.playerId} key={ "player-" + props.player.playerId } className="link">
      <div className="agentMainMidCard">
        <div className="agentMainMidCardLeft">
          <img className='agentMainMidCardLeftImg' 
              src={getPlayerPhotoUrl()}
              alt={ props.player.name }
              onError={ e => (e.target as HTMLImageElement).src = Config.API_PATH + '/assets/placeholder.png' } />
        </div>
        <div className="agentMainMidCardRight">
          <p><b>Name:</b> {props.player.name} {props.player.surname}</p>
          <p><strong>Position:</strong> {props.player.position}</p>
          <p><strong>Club:</strong> {props.player.club}</p>
        </div>
      </div>
    </Link>
  )
}
