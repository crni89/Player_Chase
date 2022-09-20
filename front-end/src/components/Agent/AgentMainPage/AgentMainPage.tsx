import './AgentMainPage.css';
import logo from '../../../resources/img/logo.png';
import { useEffect, useState } from 'react';
import ICategory from '../../../models/ICategory.model';
import IPlayer from '../../../models/IPlayer.model';
import IAgent from '../../../models/IAgent.model';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../api/api';
import PlayerCard from '../PlayerCard/PlayerCard';
import AppStore from '../../../stores/AppStore';
import { Config } from '../../../config';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket, faWindowClose } from '@fortawesome/free-solid-svg-icons';

export interface IAgentCategoryPageUrlParams extends Record<string, string | undefined> {
  cid: string
}

export interface IAgentCategoryProperties {
  categoryId?: number;
}

export default function AgentMainPage(props: IAgentCategoryProperties) {

    const [ category, setCategory ]   = useState<ICategory|null>(null);
    const [ players, setPlayer ]      = useState<IPlayer[]>([]);
    const [ errorMessage, setErrorMessage ] = useState<string>("");
    const [ loading, setLoading ]           = useState<boolean>(false);
    const [agent, setAgent] = useState<IAgent>();
    const navigate = useNavigate();

    const params = useParams<IAgentCategoryPageUrlParams>();
    const categoryId = props?.categoryId ?? params.cid;

    useEffect(() => {
      setLoading(true);

      api("get", "/api/category/" + categoryId, "agent")
      .then(res => {
          if (res.status === 'error') {
              throw new Error('Could not get catgory data!');
          }

          setCategory(res.data);
      })
      .then(() => {
          return api("get", "/api/category/" + categoryId + "/player", "agent")
      })
      .then(res => {
          if (res.status === 'error') {
              throw new Error('Could not get catgory players!');
          }

          setPlayer(res.data);
      })
      .catch(error => {
          setErrorMessage(error?.message ?? 'Unknown error while loading this category!');
      })
      .finally(() => {
          setLoading(false);
      });
  }, [ categoryId ]);

  const [filterText, setFilterText] = useState("");

  const filteredPlayers = players.filter(
      player =>
      player.name.toLocaleLowerCase().includes(filterText) ||
      player.surname.toLocaleLowerCase().includes(filterText) ||
      player.club.toLocaleLowerCase().includes(filterText) ||
      player.position.toLocaleLowerCase().includes(filterText)
  );

  const playerssToDisplay = filterText ? filteredPlayers : players;

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

function doUserLogout() {
  AppStore.dispatch( { type: "auth.reset" } );
  navigate("/api/auth/agent/login");
}


  return (
    <div className='agentMainContainer'>
      <div className="agentMainTop">
        <div className="agentMainTopLeft">
          <img src={logo} className="agentMainTopLeftImg" alt={logo} />
        </div>
        <div className="agentMainTopMid">
          <div className="input-group mt-2">
            <input type="search" className="form-control" placeholder="Search player" aria-label="Search" aria-describedby="search-addon" value={filterText}
                       onChange={(e) => setFilterText(e.target.value)} />
            {/* <button type="button" className="btn btn-outline-primary">search</button> */}
          </div>
        </div>
        <div className="agentMainTopRight">
          <p className='agentMainTopRightP'>{agent?.name} {agent?.surname}</p>
          <Link to={"/agent/"+agent?.agentId+"/profile"}>
          <img src={Config.API_PATH + "/assets/" + agent?.photos[0].filePath} 
                            alt={agent?.name}
                            className="agentMainTopRightImg"
          />
          </Link>
          <FontAwesomeIcon icon={ faRightFromBracket } className="logout" onClick={ () => doUserLogout() } />
        </div>
      </div>
      <div className="agentMain">
        <div className="agentMainLeft">

        </div>
        <div className="agentMainMid">
        { playerssToDisplay.map(player => <PlayerCard key={ "player-" + player.playerId } player={ player } /> ) }
        </div>
        <div className="agentMainRight">

        </div>
      </div>
      <div className="agetnMainFooter">

      </div>
    </div>
  )
}