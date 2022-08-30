import Ajv from "ajv";
import addFormats from "ajv-formats";
// import * as formats from "ajv-formats-draft2019/formats"; // Za IDN podrsku: npm i ajv-formats-draft2019
import IServiceData from "../../../common/IServiceData.interface";

// const ajv = new Ajv({ formats }); // Za IDN podrsku
const ajv = new Ajv();
addFormats(ajv);

export interface IRegisterPlayerDto {
    email: string;
    password: string;
    name: string;
    surname: string;
    club: string;
    dob: string;
    height: string;
    weight: string;
    position: string;
}

export interface IAddPlayer extends IServiceData {
    email: string;
    password_hash: string;
    name: string;
    surname: string;
    club: string;
    dob: string;
    height: string;
    weight: string;
    position: string;
    activation_code: string;
    category_id: number;
}

const RegisterPlayerValidator = ajv.compile({
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
    },
    required: [
        "email",
        "password",
        "name",
        "surname",
        "club",
        "dob",
        "height",
        "weight",
        "position"
    ],
    additionalProperties: false,
});

export { RegisterPlayerValidator };
