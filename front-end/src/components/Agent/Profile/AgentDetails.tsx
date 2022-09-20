import React, { useState } from 'react'
import { api } from '../../../api/api';
import IAgent from '../../../models/IAgent.model';

export interface IAgentDetailsEditorProperties {
    agent: IAgent;
    onDataChanged: (agent: IAgent) => void;
}

interface IInputData {
    value: string;
    isValid: boolean;
}

export default function AgentDetailsEditor(props: IAgentDetailsEditorProperties) {
    const [ name, setName ] = useState<IInputData>({ value: props.agent.name, isValid: true });
    const [ surname,  setSurname  ] = useState<IInputData>({ value: props.agent.surname,  isValid: true });
    const [ club,  setClub  ] = useState<IInputData>({ value: props.agent.club,  isValid: true });
    const [ error,    setError    ] = useState<string>("");
    const [ message,  setMessage  ] = useState<string>("");

    function reset() {
        setName({
            value: props.agent.name,
            isValid: true,
        });

        setSurname({
            value: props.agent.surname,
            isValid: true,
        });

        setClub({
            value: props.agent.club,
            isValid: true,
        });
    }

    function nameChanged(e: React.ChangeEvent<HTMLInputElement>) {
        setName({
            value: e.target.value,
            isValid: true,
        });

        if (!e.target.value.trim().match(/^.{2,32}$/)) {
            setName({
                value: e.target.value,
                isValid: false,
            });
        }
    }

    function surnameChanged(e: React.ChangeEvent<HTMLInputElement>) {
        setSurname({
            value: e.target.value,
            isValid: true,
        });

        if (!e.target.value.trim().match(/^.{2,32}$/)) {
            setSurname({
                value: e.target.value,
                isValid: false,
            });
        }
    }

    function clubChanged(e: React.ChangeEvent<HTMLInputElement>) {
        setClub({
            value: e.target.value,
            isValid: true,
        });

        if (!e.target.value.trim().match(/^.{2,32}$/)) {
            setClub({
                value: e.target.value,
                isValid: false,
            });
        }
    }

    function doSaveDetails() {
        if (!name.isValid || !surname.isValid || !club.isValid) {
            return;
        }

        api("put", "/api/agent/" + props.agent.agentId, "agent", { name: name.value, surname: surname.value, club: club.value })
        .then(res => {
            if (res.status !== 'ok') {
                throw new Error("Could not edit agent data! Reason: " + JSON.stringify(res.data));
            }

            return res.data;
        })
        .then(agent => {
            props.onDataChanged(agent);

            setMessage("New agent data saved!");

            setTimeout(() => setMessage(''), 5000);
        })
        .catch(error => {
            setError(error?.message ?? 'Unknown error!');

            setTimeout(() => setError(''), 5000);
        });
    }


  return (
    <div className="card">
        <div className="card-body">
            <div className="card-title">
                <h2 className="h6">Account details</h2>
            </div>

            <div className="card-text">
                <div className="form-group mb-3">
                    <label>Name</label>
                    <div className="input-group">
                        <input className={ "form-control" + (!name.isValid ? " is-invalid": '') } maxLength={ 32 } value={ name.value }
                            onChange={ e => nameChanged(e) } />
                    </div>
                </div>

                <div className="form-group mb-3">
                    <label>Surname</label>
                    <div className="input-group">
                        <input className={ "form-control" + (!surname.isValid ? " is-invalid": '') } maxLength={ 32 } value={ surname.value }
                            onChange={ e => surnameChanged(e) } />
                    </div>
                </div>

                <div className="form-group mb-3">
                    <label>Club</label>
                    <div className="input-group">
                        <input className={ "form-control" + (!club.isValid ? " is-invalid": '') } maxLength={ 32 } value={ club.value }
                            onChange={ e => clubChanged(e) } />
                    </div>
                </div>

                <div className="form-group">
                    <button className="btn btn-primary" onClick={ () => doSaveDetails() }>
                        Save new details
                    </button> <button className="btn btn-secondary" onClick={ () => reset() }>
                        Reset changes
                    </button>
                </div>

                { error && <div className="mt-3 alert alert-danger">{ error }</div> }
                { message && <div className="mt-3 alert alert-success">{ message }</div> }
            </div>
        </div>
    </div>
  )
}
