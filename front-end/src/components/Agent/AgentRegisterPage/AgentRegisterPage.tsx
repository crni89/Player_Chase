/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useState } from 'react'
import './AgentRegisterPage.css';
import basket from "../../../resources/img/basketball.jpg";
import { api } from '../../../api/api';
import { useNavigate } from 'react-router-dom';

export default function AgentRegisterPage() {
    const [ email, setEmail ]       = useState<string>("");
    const [ password, setPassword ] = useState<string>("");
    const [ name, setName ] = useState<string>("");
    const [ surname, setSurname ]   = useState<string>("");
    const [ club, setClub ]   = useState<string>("");
    const [ error, setError ]       = useState<string>("");

    const navigate = useNavigate();

    const doRegister = () => {
        api("post", "/api/agent/register", "agent", { email, password, name, surname, club })
        .then(res => {
            if (res.status !== "ok") {
                throw new Error("Could not register your account. Reason: " + JSON.stringify(res.data));
            }
        })
        .then(() => {
            navigate("/finreg", {
                replace: true,
            });
        })
        .catch(error => {
            setError(error?.message ?? "Could not register your account.");

            setTimeout(() => {
                setError("");
            }, 3500);
        });
    };
    
    
  return (
    <section className="h-100 bg-dark">
    <div className="container h-100">
        <div className="row d-flex justify-content-center align-items-center h-100">
        <div className="col">
            <div className="card card-registration my-4">
            <div className="row g-0">
                <div className="col-md-6 d-none d-lg-block">
                <img src={basket}
                    alt="Sample photo" className="img-fluid"
                    style={{borderTopLeftRadius: ".25rem", borderBottomLeftRadius:".25rem"}} />
                </div>
                <div className="col-xl-6">
                    <div className="card-body p-md-5 text-black">
                        <h3 className="mb-5 text-uppercase">Agent registration</h3>

                        <div className="row">
                        <div className="col-md-6 mb-4">
                            <div className="form-floating">
                                <input type="text" className="form-control" placeholder="Enter your name"
                                value={ name }
                                onChange={ e => setName(e.target.value) }
                                />
                                <label className='form-label'>First name</label>
                            </div>
                        </div>
                        <div className="col-md-6 mb-4">
                            <div className="form-floating">
                                <input type="text" className="form-control" placeholder="Enter your surname"
                                value={ surname }
                                onChange={ e => setSurname(e.target.value) }
                                />
                                <label className='form-label'>Surname</label>
                            </div>
                        </div>
                            <div className="col-md-6 mb-4">
                                <div className="form-floating">
                                    <input type="text" className="form-control" placeholder="Enter club name"
                                    value={ club }
                                    onChange={e => setClub(e.target.value)}
                                    />
                                    <label className='form-label'>Club name</label>
                                </div>
                            </div>
                            <div className="col-md-6 mb-4">
                                <div className="form-floating">
                                    <input type="email" className="form-control" placeholder="Enter email"
                                    value={ email }
                                    onChange={ e => setEmail(e.target.value) }
                                    />
                                    <label className='form-label'>Email</label>
                                </div>
                            </div>
                            <div className="col-md-6 mb-4">
                                <div className="form-floating">
                                    <input type="password" className="form-control" placeholder="Enter password"
                                    value={ password }
                                    onChange={ e => setPassword(e.target.value) }
                                    />
                                    <label className='form-label'>Password</label>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end pt-3">
                        <button className="btn btn-light btn-lg">Reset all</button>
                        <button className="btn btn-warning btn-lg ms-2" onClick={ () => doRegister() }>Submit</button>
                        </div>
                        { error && <p className="alert alert-danger">{ error }</p> }
                    </div>
                </div>
            </div>
            </div>
        </div>
        </div>
    </div>
    </section>
  )
}
