import Ajv from "ajv";
import addFormats from "ajv-formats";
import IServiceData from "../../../common/IServiceData.interface";

const ajv = new Ajv();
addFormats(ajv);

export default interface IEditPlayer extends IServiceData {
    password_hash?: string;
    is_active?: number;
    name?: string;
    surname?: string;
    activation_code?: string;
    club?: string;
    dob?: string;
    height?: string;
    weight?: string;
    position?: string;
    password_reset_code?: string;
}

export interface IEditPlayerDto {
    password?: string;
    isActive?: boolean;
    name?: string;
    surname?: string;
    club?: string;
    dob?: string;
    height?: string;
    weight?: string;
    position?: string;
}

const EditPlayerValidator = ajv.compile({
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
            maxLength: 128,
        },
        dob:{
            type:"string",
            pattern: "[0-9]{2}[.][0-9]{2}[.][0-9]{4}$",
        },
        height: {
            type: "string",
            minLength: 2,
            maxLength: 64,
        },
        weight: {
            type: "string",
            minLength: 2,
            maxLength: 64,
        },
        position: {
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

export { EditPlayerValidator };
