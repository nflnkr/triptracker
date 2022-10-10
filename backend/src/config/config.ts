import dotenv from 'dotenv';
import { cookieSettings } from './cookie';

dotenv.config();

const MONGO_OPTIONS = {
    keepAlive: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
}

const SERVER_HOSTNAME = process.env.SERVER_HOSTNAME || "localhost";
const SERVER_PORT = process.env.SERVER_PORT || 3001;
const MONGODB_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/";
const SESSION_SECRET = process.env.SESSION_SECRET || 'secret';

const MONGO = {
    options: MONGO_OPTIONS,
    url: MONGODB_URL
}

const SERVER = {
    hostname: SERVER_HOSTNAME,
    port: SERVER_PORT,
    sessionSecret: SESSION_SECRET,
    cookieSettings
}

const config = {
    server: SERVER,
    mongo: MONGO,
    trackDefaults: {
        type: "other",
        color: "#535cd4ff"
    }
}

export default config;