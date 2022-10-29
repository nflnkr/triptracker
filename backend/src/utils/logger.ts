import fs from "fs";
import path from "path";
import { Request, Response, NextFunction } from "express";
import { StreamWriteError } from "./errors";


class Logger {
    private readonly errorStream: fs.WriteStream;
    private readonly warnStream: fs.WriteStream;
    private readonly requestStream: fs.WriteStream;

    constructor(folderpath: string) {
        this.errorStream = fs.createWriteStream(path.join(folderpath, "errors.log"), { flags: "a" });
        this.warnStream = fs.createWriteStream(path.join(folderpath, "warnings.log"), { flags: "a" });
        this.requestStream = fs.createWriteStream(path.join(folderpath, "requests.log"), { flags: "a" });
    }
    writeLine(text: string, stream: fs.WriteStream) {
        const date = new Date();
        stream.write(`\n${date.toLocaleString()}.${date.getMilliseconds()}: ${text}`, err => {
            if (err) throw new StreamWriteError(err?.message);
        });
    }
    writeError(error: Error) {
        this.writeLine(`ERROR ${error.name} ${error.message}`, this.errorStream);
    }
    writeWarn(text: string) {
        this.writeLine(`WARN ${text}`, this.warnStream);
    }
    requestLogger(req: Request, res: Response, next: NextFunction) {
        this.writeLine(`REQUEST method=${req.method} url=${req.originalUrl} userId=${req.session.passport.user || "no user"}`, this.requestStream);
        next();
    }
}

export const logger = new Logger(path.join(process.cwd(), "data/logs"));