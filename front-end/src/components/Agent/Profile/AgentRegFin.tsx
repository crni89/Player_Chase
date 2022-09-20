import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom';
import { api } from '../../../api/api';
import IAgent from '../../../models/IAgent.model';
import AppStore from '../../../stores/AppStore';
import AgentDetails from './AgentDetails';
import AgentPhotos from './AgentPhotos'

export interface IAgentUrlParams extends Record<string, string | undefined> {
    id: string
}

export default function AgentRegFin() {

    const params = useParams<IAgentUrlParams>();
    const agentId = +(params.id ?? '');

    const [ agent, setAgent ] = useState<IAgent>();

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
                        { agent && <AgentDetails   agent={ agent } onDataChanged={ agent => setAgent(agent) } /> }
                    </div>
                </div>

                <div className="row">
                    <div className="col col-12">
                        <AgentPhotos agentId={ agentId } />
                    </div>
                </div>
                <Link to={"/select"} className="btn btn-success mt-5">NEXT</Link>
            </div>
        </div>
    </div>
  )
}
