import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../api/api';
import IAgent from '../../../models/IAgent.model';
import AppStore from '../../../stores/AppStore';
import AgentDetailsEditor from './AgentDetailsEditor';
import AgentPasswordChanger from './AgentPasswordChanger';
import AgentPhotos from './AgentPhotos';

export interface IAgentEditUrlParams extends Record<string, string | undefined> {
    id: string
}

export default function AgentProfile() {

    const params = useParams<IAgentEditUrlParams>();
    const agentId = +(params.id ?? '');

    const [ agent, setAgent ] = useState<IAgent>();
    const navigate = useNavigate();

    function loadAgentData() {
        if ( AppStore.getState().auth.role !== "agent" ) {
            return;
        }

        api("get", "/api/agent/" + AppStore.getState().auth.id, "agent")
        .then(res => {
            if (res.status !== 'ok') {
                throw new Error("Coudl not fetch this data. Reason: " + JSON.stringify(res.data));
            }

            return res.data;
        })
        .then(agent => {
            setAgent(agent);
        })
        .catch(error => {

        });
    };

    useEffect(loadAgentData, []);

  return (
    <div className="card">
        <div className="card-body">
            <div className="card-title mb-3">
                <h1 className="h5">My profile</h1>
            </div>
            <div className="card-text">
                <div className="row mb-4">
                    <div className="col col-12 col-lg-6">
                        { agent && <AgentDetailsEditor   agent={ agent } onDataChanged={ agent => setAgent(agent) } /> }
                        <div className='mt-3'>
                        { agent && <AgentPasswordChanger agent={ agent } onPasswordChange={ agent => setAgent(agent) } /> }
                        </div>
                    </div>

                    <div className="col col-12 col-lg-6 ">
                        <AgentPhotos agentId={ agentId } />
                    </div >
                </div>

                <div className="row">
                    <button onClick={()=> navigate(-1)} className='btn btn-outline-success mt-4'>
                        Back
                    </button>
                </div>
            </div>
        </div>
    </div>
  )
}
