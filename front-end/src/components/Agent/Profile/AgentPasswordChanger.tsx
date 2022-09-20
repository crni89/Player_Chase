import { useState } from 'react'
import { api } from '../../../api/api';
import IAgent from '../../../models/IAgent.model';

export interface IAgentDetailsEditorProperties {
    agent: IAgent;
    onPasswordChange: (agent: IAgent) => void;
}

interface IInputData {
    value: string;
    isValid: boolean;
}

export default function AgentPasswordChanger(props: IAgentDetailsEditorProperties) {

    const [ newPassword1, setNewPassword1 ] = useState<IInputData>({ value: "", isValid: true });
    const [ newPassword2, setNewPassword2 ] = useState<IInputData>({ value: "",  isValid: true });
    const [ error,    setError    ] = useState<string>("");
    const [ message,  setMessage  ] = useState<string>("");

    function reset() {
        setNewPassword1({
            value: "",
            isValid: true,
        });

        setNewPassword2({
            value: "",
            isValid: true,
        });
    }

    function newPassword1Changed(e: React.ChangeEvent<HTMLInputElement>) {
        setNewPassword1({
            value: e.target.value,
            isValid: true,
        });

        if (!e.target.value.trim().match(/^.{6,32}$/)) {
            setNewPassword1({
                value: e.target.value,
                isValid: false,
            });
        }
    }

    function newPassword2Changed(e: React.ChangeEvent<HTMLInputElement>) {
        setNewPassword2({
            value: e.target.value,
            isValid: true,
        });

        if (!e.target.value.trim().match(/^.{6,32}$/)) {
            setNewPassword2({
                value: e.target.value,
                isValid: false,
            });
        }
    }

    function doSaveDetails() {
        if (!newPassword1.isValid || !newPassword2.isValid) {
            setError('The new password is not valid. Must have at least 6 characters, and must have uppercase letters, lowercase letters, digits and at least one symbol.');
            setTimeout(() => setError(''), 10000);
            return;
        }

        if (newPassword1.value !== newPassword2.value) {
            setError('The passwords in both input fields must match!');
            setTimeout(() => setError(''), 5000);
            return;
        }

        api("put", "/api/agent/" + props.agent.agentId, "agent", { password: newPassword1.value })
        .then(res => {
            if (res.status !== 'ok') {
                throw new Error("Could not change the password! Reason: " + JSON.stringify(res.data));
            }

            return res.data;
        })
        .then(agent => {
            props.onPasswordChange(agent);

            setMessage("The password has been saved!");

            setTimeout(() => setMessage(''), 5000);

            setNewPassword1({ value: '', isValid: true });
            setNewPassword2({ value: '', isValid: true });
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
                <h2 className="h6">Account password</h2>
            </div>

            <div className="card-text">
                <div className="form-group mb-3">
                    <label>New password</label>
                    <div className="input-group">
                        <input type="password" className={ "form-control" + (!newPassword1.isValid ? " is-invalid": '') } maxLength={ 128 } value={ newPassword1.value }
                            onChange={ e => newPassword1Changed(e) } />
                    </div>
                </div>

                <div className="form-group mb-3">
                    <label>Repeat the new password</label>
                    <div className="input-group">
                        <input type="password" className={ "form-control" + (!newPassword2.isValid ? " is-invalid": '') } maxLength={ 128 } value={ newPassword2.value }
                            onChange={ e => newPassword2Changed(e) } />
                    </div>
                </div>

                <div className="form-group">
                    <button className="btn btn-primary" onClick={ () => doSaveDetails() }>
                        Change the password
                    </button> <button className="btn btn-secondary" onClick={ () => reset() }>
                        Clear the fields
                    </button>
                </div>

                { error && <div className="mt-3 alert alert-danger">{ error }</div> }
                { message && <div className="mt-3 alert alert-success">{ message }</div> }
            </div>
        </div>
    </div>
  )
}
