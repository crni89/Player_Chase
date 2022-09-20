import './AgentLoginPage.css'
import { Link, useNavigate } from 'react-router-dom';
import soccer from "../../../resources/img/lopta.jpg";
import { useState } from 'react';
import { api } from '../../../api/api';
import AppStore from '../../../stores/AppStore';
import { Button } from 'react-bootstrap';

export default function AgentLoginPage() {
  
  const [ email, setEmail ]       = useState<string>("");
  const [ password, setPassword ] = useState<string>("");
  const [ error, setError ]       = useState<string>("");

  const navigate = useNavigate();

  const doLogin = () => {
      api("post", "/api/auth/agent/login", "agent", { email, password })
      .then(res => {
          if (res.status !== "ok") {
              throw new Error("Could not log in. Reason: " + JSON.stringify(res.data));
          }

          return res.data;
      })
      .then(data => {
          AppStore.dispatch( { type: "auth.update", key: "authToken", value: data?.authToken } );
          AppStore.dispatch( { type: "auth.update", key: "refreshToken", value: data?.refreshToken } );
          AppStore.dispatch( { type: "auth.update", key: "identity", value: email } );
          AppStore.dispatch( { type: "auth.update", key: "id", value: +(data.id) } );
          AppStore.dispatch( { type: "auth.update", key: "role", value: "agent" } );

          navigate("/select", {
              replace: true,
          });
      })
      .catch(error => {
          setError(error?.message ?? "Could not log in!");

          setTimeout(() => {
              setError("");
          }, 3500);
      });
  };
  
  return (
    
<section className="text-center text-lg-start">
  <div className="container py-4">
  { error && <p className="alert alert-danger">{ error }</p> }
    <div className="row g-0 align-items-center">
      <div className="col-lg-6 mb-5 mb-lg-0">
        <div className="card cascading-right" style={{background: "hsla(0, 0% , 100% , 0.55)", backdropFilter:"blur(30px)"}}>
          <div className="card-body p-5 shadow-5 text-center">
            <h2 className="fw-bold mb-5">Login for Agents</h2>
            <form>

              
            <div className="form-floating mb-4">
              <input type="email" className="form-control" id="floatingInput" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)}/>
              <label htmlFor="floatingInput" className='form-label'>Email</label>
            </div>

              
            <div className="form-floating mb-4">
              <input type="password" className="form-control" id="floatingInput" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)}/>
              <label htmlFor="floatingInput" className='form-label'>Password</label>
            </div>
            

              
              <Button className="btn btn-primary btn-block mb-4" onClick={ () => doLogin() }>
                Login
              </Button>

              
              <div className="text-center">
                <p>Don't have an account?</p>
                <Link to={'/api/agent/register'} className="btn btn-outline-info btn-floating mx-1">
                  Click here
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="col-lg-6 mb-5 mb-lg-0">
        <img src={soccer} className="w-100 rounded-4 shadow-4"
          alt="" />
      </div>
    </div>
  </div>
</section>

  )
}
