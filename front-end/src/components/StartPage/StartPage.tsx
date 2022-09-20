import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './StartPage.css';

export default function StartPage() {
  return (
    <div className='containers'>
      <div className="cards">
        <div className='card-header'>
          <h4>Welcome to Player Chase!</h4>
        </div>
        <div className='card-body mt-5'>
          <Link to={'/api/auth/agent/login'} className="btn btn-primary me-5" >Login as agent</Link>
          <Button>Login as player</Button>

        </div>
      </div>
        {/* <Link>Login as player</Link> */}
    </div>
  )
}
