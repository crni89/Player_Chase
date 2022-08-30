import BaseService from "../../common/BaseService";
import IAdapterOptions from "../../common/IAdapterOptions.interface";
import AgentModel from "./AgentModel.model";
import IEditAgent from "./dto/IEditAgent.dto";
import { IAddAgent } from "./dto/IRegisterAgent.dto";


export interface IAgentAdapterOptions extends IAdapterOptions {
    removePassword: boolean;
    removeActivationCode: boolean;
    loadPhotos: boolean;
}

export const DefaultAgentAdapterOptions: IAgentAdapterOptions = {
    removePassword: false,
    removeActivationCode: false,
    loadPhotos: false,
}

export default class AgentService extends BaseService<AgentModel, IAgentAdapterOptions> {
    tableName(): string {
        return "agent";
    }

    protected async adaptToModel(data: any, options: IAgentAdapterOptions = DefaultAgentAdapterOptions): Promise<AgentModel> {
        const agent = new AgentModel();

        agent.agentId         = +data?.agent_id;
        agent.email          = data?.email;
        agent.passwordHash   = data?.password_hash;
        agent.name       = data?.name;
        agent.surname        = data?.surname;
        agent.club          =data?.club;
        agent.isActive       = +data?.is_active === 1;
        agent.activationCode = data?.activation_code ? data?.activation_code : null;
        agent.passwordResetCode = data?.password_reset_code ? data?.password_reset_code : null;

        if (options.removePassword) {
            agent.passwordHash = null;
        }

        if (options.removeActivationCode) {
            agent.activationCode = null;
        }

        if (options.loadPhotos) {
            agent.photos = await this.services.photo.getAllByAgentId(agent.agentId);
        }

        return agent;
    }

    public async add(data: IAddAgent): Promise<AgentModel> {
        return this.baseAdd(data, {
            removeActivationCode: false,
            removePassword: true,
            loadPhotos: false
        });
    }

    public async edit(id: number, data: IEditAgent, options: IAgentAdapterOptions = { removePassword: true, removeActivationCode: true, loadPhotos: false }): Promise<AgentModel> {
        return this.baseEditById(id, data, options);
    }

    public async getAgentByActivateionCode(code: string, option: IAgentAdapterOptions = DefaultAgentAdapterOptions): Promise<AgentModel|null> {
        return new Promise((resolve, reject) => {
            this.getAllByFieldNameAndValue("activation_code", code, option)
            .then(result => {
                if (result.length === 0) {
                    return resolve(null);
                }

                resolve(result[0]);
            })
            .catch(error => {
                reject(error?.message);
            });
        });
    }

    public async getAgentByPasswordResetCode(code: string, option: IAgentAdapterOptions = DefaultAgentAdapterOptions): Promise<AgentModel|null> {
        return new Promise((resolve, reject) => {
            this.getAllByFieldNameAndValue("password_reset_code", code, option)
            .then(result => {
                if (result.length === 0) {
                    return resolve(null);
                }

                resolve(result[0]);
            })
            .catch(error => {
                reject(error?.message);
            });
        });
    }

    public async getByEmail(email: string, option: IAgentAdapterOptions = DefaultAgentAdapterOptions): Promise<AgentModel|null> {
        return new Promise((resolve, reject) => {
            this.getAllByFieldNameAndValue("email", email, option)
            .then(result => {
                if (result.length === 0) {
                    return resolve(null);
                }

                resolve(result[0]);
            })
            .catch(error => {
                reject(error?.message);
            });
        });
    }
}
