import React, { useEffect, useState } from 'react'
import ReactPlayer from 'react-player';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../api/api';
import { Config } from '../../../config';
import IPlayer from '../../../models/IPlayer.model';
import AppStore from '../../../stores/AppStore';

export interface IPlayerViewUrlParams extends Record<string, string | undefined> {
    cid: string
    id: string
}
  
export default function PLayerView() {

    const params = useParams<IPlayerViewUrlParams>();
    const playerId = params.id;
    const categoryId = params.cid;

    const navigate = useNavigate();

    const [ player, setPlayer ] = useState<IPlayer>();

    function loadPlayerData() {
        if ( AppStore.getState().auth.role !== "agent" ) {
            return;
        }

        api("get", "/api/category/" + categoryId + "/player/" + playerId , "agent")
        .then(res => {
            if (res.status !== 'ok') {
                throw new Error("Coudl not fetch this data. Reason: " + JSON.stringify(res.data));
            }

            return res.data;
        })
        .then(player => {
            setPlayer(player);
        })
        .catch(error => {

        });
    };

    useEffect(loadPlayerData, [categoryId, playerId]);

  return (
    <div className='card w-50 h-50 m-auto mt-3'>
        <div className='card-header'>
            <img src={Config.API_PATH + "/assets/" + player?.photos[0].filePath} 
             alt={player?.name} className="card-img-top"/>
        </div>
        <div className='card-body'>
            <h5 className='card-title text-center'>{player?.name} {player?.surname}</h5>
            <div className='row mt-5'>
                <div className='col col-12 col-lg-6'>
                <ul className="list-group list-group-flush">
                    <li className="list-group-item"><strong>Club:</strong> {player?.club}</li>
                    <li className="list-group-item"><strong>Position:</strong> {player?.position}</li>
                    <li className="list-group-item"><strong>DOB:</strong> {player?.dob}</li>
                </ul>
                </div>
                <div className='col col-12 col-lg-6'>
                <ul className="list-group list-group-flush">
                    <li className="list-group-item"><strong>Height:</strong> {player?.height} cm</li>
                    <li className="list-group-item"><strong>Weight:</strong> {player?.weight} kg</li>
                </ul>
                </div>
            </div>
            <div className='row mt-4'>
                <div className='col col-12 col-lg-6'>
                    <ul className="list-group list-group-flush">
                    <li className="list-group-item"><strong>Contact:</strong> {player?.email}</li>
                    </ul>
                </div>
            </div>
            <div className='row mt-5 justify-content-center'>
                <div className='col col-12 col-lg-10'>
                <ReactPlayer width="100%" height="50%" controls url={Config.API_PATH + "/assets/" + player?.videos[0].filePath}/>
                <br />
                <ReactPlayer width="100%" height="50%" controls url={Config.API_PATH + "/assets/" + player?.videos[1].filePath}/>
                </div>
            </div>
            <div className='row mt-4'>
                <button onClick={()=> navigate(-1)} className='btn btn-outline-success mt-4'>
                    Back
                </button>
            </div>
        </div>
    </div>
  )
}
