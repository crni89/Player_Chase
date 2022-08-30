import Ajv from "ajv";
import addFormats from "ajv-formats";
import IServiceData from "../../../common/IServiceData.interface";

const ajv = new Ajv();
addFormats(ajv);

export default interface IEditAgent extends IServiceData {
    password_hash?: string;
    is_active?: number;
    name?: string;
    surname?: string;
    club?: string;
    activation_code?: string;
    password_reset_code?: string;
}

export interface IEditAgentDto {
    password?: string;
    isActive?: boolean;
    name?: string;
    surname?: string;
    club?: string;
}

const EditAgentValidator = ajv.compile({
    type: "object",
    properties: {
        password: {
            type: "string",
            pattern: "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{6,}$",
        },
        name: {
            type: "string",
            minLength: 2,
            maxLength: 64,
        },
        surname: {
            type: "string",
            minLength: 2,
            maxLength: 64,
        },
        club: {
            type: "string",
            minLength: 2,
            maxLength: 64,
        },
        isActive: {
            type: "boolean",
        },
    },
    required: [
        
    ],
    additionalProperties: false,
});

export { EditAgentValidator };
