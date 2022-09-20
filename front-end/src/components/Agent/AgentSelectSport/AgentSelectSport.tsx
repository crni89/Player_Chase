import basketBall from '../../../resources/img/basket_ball.png';
import volleyBall from '../../../resources/img/volley_ball.png';
import soccerBall from '../../../resources/img/soccer_ball.png';
import basketArena from '../../../resources/img/basketball_arena.jpg';
import './AgentSelectSpot.scss';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ICategory from '../../../models/ICategory.model';
import { api } from '../../../api/api';
import AppStore from '../../../stores/AppStore';
import IAgent from '../../../models/IAgent.model';


export default function AgentSelectSport() {

  const [ sports, setSports ] = useState<ICategory>();
  const [ errorMessage, setErrorMessage ] = useState<string>("");

  const [agent, setAgent] = useState<IAgent>();

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

  const basketball = ('/api/category/1/player');
  const volleyball = ('/api/category/3/player');
  const soccer = ('/api/category/2/player');

  useEffect(() => {
    api("get", "/api/category", "agent")
    .then(apiResponse => {
        if (apiResponse.status === 'ok') {
            return setSports(apiResponse.data);
        }

        throw new Error('Unknown error while loading sports...');
    })
    .catch(error => {
        setErrorMessage(error?.message ?? 'Unknown error while loading categories...');
    });
}, [ ]);

  return (
    
      <div className='slecetSports-container'>
        <img src={basketArena} alt={basketArena} className='containerImg' />
        <div className="selectSports">
          <div className="sportsIcons">
            <div className="sportsImg">
              <Link to={basketball} >
              <img className='images' src={basketBall} alt={basketBall} />
              </Link>
              <p className='sportsText'>Basketball</p>
            </div>
            <div className="sportsImg1">
              <Link to={volleyball}>
              <img className='images' src={volleyBall} alt={volleyBall} />
              </Link>
              <p className='sportsText1'>Volleyball</p>
            </div>
            <div className="sportsImg2">
              <Link to={soccer}>
              <img className='images' src={soccerBall} alt={soccerBall} />
              </Link>
              <p className='sportsText2'>Soccer</p>
            </div>
          </div>
        </div>
      </div>
  )
}
