import Ajv from "ajv";
import IServiceData from "../../../common/IServiceData.interface";

const ajv = new Ajv();

export default interface IAddCategory extends IServiceData {
    name: string;
}

const AddCategorySchema = {
    type: "object",
    properties: {
        name: {
            type: "string",
            minLength: 4,
            maxLength: 64,
        },
    },
    required: [
        "name",
    ],
    additionalProperties: false,
};

const AddCategoryValidator = ajv.compile(AddCategorySchema);

export{AddCategoryValidator};
