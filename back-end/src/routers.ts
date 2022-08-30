import CategoryRouter from "./components/category/CategoryRouter.router";
import AgentRouter from './components/agent/AgentRouter.router';
import AuthRouter from './components/auth/AuthRouter.router';


const ApplicationtRouters =  [
    new CategoryRouter(),
    new AgentRouter(),
    new AuthRouter(),
];

export default ApplicationtRouters;