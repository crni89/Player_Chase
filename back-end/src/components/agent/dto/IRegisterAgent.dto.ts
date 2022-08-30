import Ajv from "ajv";
import addFormats from "ajv-formats";
// import * as formats from "ajv-formats-draft2019/formats"; // Za IDN podrsku: npm i ajv-formats-draft2019
import IServiceData from "../../../common/IServiceData.interface";

// const ajv = new Ajv({ formats }); // Za IDN podrsku
const ajv = new Ajv();
addFormats(ajv);

export interface IRegisterAgentDto {
    email: string;
    password: string;
    name: string;
    surname: string;
    club: string;
}

export interface IAddAgent extends IServiceData {
    email: string;
    password_hash: string;
    name: string;
    surname: string;
    club: string;
    activation_code: string;
}

const RegisterAgentValidator = ajv.compile({
    type: "object",
    properties: {
        email: {
            type: "string",
            // format: "idn-email", // Za IDN podrsku
            format: "email",
        },
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
    },
    required: [
        "email",
        "password",
        "name",
        "surname",
        "club",
    ],
    additionalProperties: false,
});

export { RegisterAgentValidator };
