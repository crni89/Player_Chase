import { Provider } from 'react-redux';
import { Route, Routes } from 'react-router-dom';
import AppStore from '../../stores/AppStore';
import AgentLoginPage from '../Agent/AgentLoginPage/AgentLoginPage';
import AgentMainPage from '../Agent/AgentMainPage/AgentMainPage';
import AgentRegisterPage from '../Agent/AgentRegisterPage/AgentRegisterPage';
import AgentSelectSport from '../Agent/AgentSelectSport/AgentSelectSport';
import StartPage from '../StartPage/StartPage';
import './App.css';
import AgentProfile from '../Agent/Profile/AgentProfile';
import AgentFinishReg from '../Agent/Profile/AgentFinishReg';
import AgentRegFin from '../Agent/Profile/AgentRegFin';
import PLayerView from '../Agent/PlayerView/PlayerView';

function Application() {
  return (
    <Provider store={ AppStore }>
      <Routes>
        <Route path="/" element={ <StartPage/> } />
        <Route path='/api/auth/agent/login' element={ <AgentLoginPage /> } />
        <Route path='/api/agent/register' element={ <AgentRegisterPage/>} />
        <Route path='/select' element={ <AgentSelectSport /> } />
        <Route path='/api/category/:cid/player' element={<AgentMainPage/>} />
        <Route path='/agent/:id/profile' element={<AgentProfile/>} />
        <Route path='/finreg' element={<AgentFinishReg/>} />
        <Route path='/agent/:id/regfin' element={<AgentRegFin/>} />
        <Route path='/api/category/:cid/player/:id' element={<PLayerView/>} />
      </Routes>
    </Provider>
  );
}

export default Application;
