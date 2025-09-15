import mongoose from "mongoose";

// to convert a string id to mongodb id type
const toObjectId = (id: string): mongoose.Types.ObjectId => {
    try {
        return new mongoose.Types.ObjectId(id);
    } catch (er) {
        console.log({ er, id });
        throw Error(`Failed to convert string id : ${id} to mongoose.Types.ObjectId`)
    }
};

const createMongooseId = (id: string): mongoose.Types.ObjectId => new mongoose.Types.ObjectId(id);

const isValidMongooseId = (id: string | number | mongoose.Types.ObjectId | mongoose.mongo.BSON.ObjectIdLike | Uint8Array): boolean => mongoose.Types.ObjectId.isValid(id);

/**
 * Generates a unique property (ex. slug) value with the prefix `str` param of `Model` model
 * @param {string} str The prefix string
 * @param {mongoose.Model<any>} Model Mongoose Model - Specify the Model type
 * @param {string} prop - `default: 'slug'` The property to check for existence in the model
 * @returns Generated value
 */
const generateAnUniquePropValue = async (
    str: string,
    Model: mongoose.Model<any>,
    prop: 'slug' | string = 'slug'
): Promise<string> => {
    let proposedVal: string;

    while (true) {
        proposedVal = `${str}-${Math.floor(Math.random() * 10000)}`;
        const exists = await Model.exists({ [prop]: proposedVal });
        if (!exists) break;
    }

    return proposedVal;
};

export {
    toObjectId,
    createMongooseId,
    isValidMongooseId,
    generateAnUniquePropValue,
};