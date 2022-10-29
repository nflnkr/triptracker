import express, { Request, Response, NextFunction } from "express";
import path from "path";
import bodyParser from "body-parser";
import config from "./config/config";
import userRouter from "./routes/user";
import authRouter from "./routes/auth";
import tripRouter from "./routes/trip";
import gpxRouter from "./routes/gpx";
import placesRouter from "./routes/places";
import mongoose from "mongoose";
import session from "express-session";
import mongodbSession from "connect-mongodb-session";
import passport from "passport";
import initializePassport from "./config/passport";
import authController from "./controllers/auth";
import tileRouter from "./routes/tile";
import multer from "multer";
import { errorHandler } from "./utils/errorHandler";
import { logger } from "./utils/logger";

declare module "express-serve-static-core" {
    interface Request {
        session: {
            passport: {
                user: string;
            };
        };
    }
}

initializePassport(passport);

mongoose.connect(config.mongo.url, config.mongo.options).then(() => {
    console.log("Connected to MongoDB!");
}).catch(error => {
    console.log(error.message, error);
});

const app = express();
const formDataParser = multer().none();

const MongoDBStore = mongodbSession(session);
const store = new MongoDBStore({
    uri: config.mongo.url,
    collection: "sessions",
});
store.on("error", error => {
    console.log("Error on MongoDBStore", error);
});

app.use(session({
    secret: config.server.sessionSecret,
    store: store,
    resave: false,
    saveUninitialized: false,
    cookie: config.server.cookieSettings,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method == "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "GET PATCH DELETE POST");
        return res.status(200).json({});
    }
    next();
});

app.use(express.static(path.join(process.cwd(), "build")));

app.use(logger.requestLogger.bind(logger));

app.use("/api/user", authController.checkAuthenticated, userRouter);
app.use("/api/auth", formDataParser, authRouter);
app.use("/api/tile", tileRouter);
app.use("/api/trip", authController.checkAuthenticated, tripRouter);
app.use("/api/gpx", authController.checkAuthenticated, gpxRouter);
app.use("/api/places", authController.checkAuthenticated, placesRouter);

app.get("/api/isAuthenticated", (req, res, next) => {
    res.status(200).json({
        isAuthenticated: (req as any).isAuthenticated(),
        user: req.user,
        session: req.session
    });
});

app.post("/api/dropall", async (req, res, next) => {
    try {
        const collections = await mongoose.connection.db.collections();
        let collectionCount = 0;
        for (let collection of collections) {
            await collection.drop();
            collectionCount++;
        }
        res.status(200).json({ ok: true, deleted: collectionCount });
    } catch (error) {
        res.status(200).json({ error });
    }
});

app.get('/*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'build', 'index.html'));
});

app.use(errorHandler);

app.listen(
    config.server.port,
    () => console.log(`Server running on ${config.server.hostname}:${config.server.port}`)
);
