import { Request, Response, NextFunction } from "express";
import { UserNotFoundError, TripNotFoundError, PlaceNotFoundError, UnauthorizedAccess } from "./errors";

export function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {
    if (error instanceof UserNotFoundError) {
        return res.status(404).json({ error: "User not found" });
    } else if (error instanceof TripNotFoundError) {
        return res.status(404).json({ error: "Trip not found" });
    } else if (error instanceof PlaceNotFoundError) {
        return res.status(404).json({ error: "Place not found" });
    } else if (error instanceof UnauthorizedAccess) {
        return res.status(403).json({ error: "Unauthorized access" });
    } else if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
    } else {
        return res.status(500).json({ error: "Unknown error" });
    }
}