import mongoose, { ConnectOptions, Connection } from 'mongoose';

const connectDB = async (
    DB_CONNECTION_STRING: string,
    DB_OPTIONS: ConnectOptions = {}
): Promise<string | unknown> => {
    try {
        const connection = await mongoose.connect(DB_CONNECTION_STRING, {
            ...DB_OPTIONS,
        });

        const dbConnection: Connection = connection.connection;

        const url = (dbConnection as any)?.client?.s?.url;
        return `CONNECTION_PATH : ${url}`;

    } catch (error) {
        console.log('Error in connectDB :', error)
        return error
    }
};

export default connectDB;
