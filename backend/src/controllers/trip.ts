import type { Trip } from "../types/models";
import { Request, Response, NextFunction } from "express";
import { TripNotFoundError } from "../utils/errors";
import { tripDbController, userDbController } from "./mongodb";


async function createTrip(req: Request, res: Response, next: NextFunction) {
    const userId = req.session.passport.user;
    let tripObject = req.body.trip as Trip;
    try {
        await tripDbController.create(await userDbController.get(userId), tripObject);
        return res.status(201).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

async function getTripsByUsername(req: Request, res: Response, next: NextFunction) {
    const userId = req.session.passport.user;
    try {
        const trips = await tripDbController.getAllByUserId(userId);
        if (!trips) throw new TripNotFoundError();

        return res.status(200).json({ trips });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

async function getTripById(req: Request, res: Response, next: NextFunction) {
    const tripId = req.params.tripId;
    try {
        const trip = await tripDbController.get(tripId);
        return res.status(200).json({ success: true, trip });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

async function updateTripById(req: Request, res: Response, next: NextFunction) {
    const tripId = req.params.tripId;
    let updatedTrip = req.body.trip as Trip;
    try {
        await tripDbController.update(tripId, updatedTrip);
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

async function deleteTripById(req: Request, res: Response, next: NextFunction) {
    const userId = req.session.passport.user;
    const tripId = req.params.tripId;
    try {
        await tripDbController.delete(userDbController.get(userId), tripId);
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

export default {
    getTripsByUsername,
    deleteTripById,
    createTrip,
    updateTripById,
    getTripById
};