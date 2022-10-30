import { Request, Response, NextFunction } from "express";
import type { PointOfInterest } from "../types/models";
import { UnauthorizedAccess } from "../utils/errors";
import { placeDbController, userDbController } from "./mongodb";


async function createPlace(req: Request, res: Response, next: NextFunction) {
    const userId = req.session.passport.user;
    const place = req.body.place as PointOfInterest;
    try {
        const result = await placeDbController.create(await userDbController.get(userId), place);
        return res.status(201).json({ success: true, place: result });
    } catch (error) {
        next(error);
    }
}

async function getPlaces(req: Request, res: Response, next: NextFunction) {
    const userId = req.session.passport.user;
    try {
        const returnPlaces = await placeDbController.getAllByUserId(userId);
        return res.status(200).json({ places: returnPlaces });
    } catch (error) {
        next(error);
    }
}

async function updatePlace(req: Request, res: Response, next: NextFunction) {
    const userId = req.session.passport.user;
    const placeId = req.params.placeId;
    let updatedPlace = req.body.trip as PointOfInterest;
    try {
        const user = await userDbController.get(userId);
        if (!user.places.includes(placeId as any)) throw new UnauthorizedAccess();

        await placeDbController.update(placeId, updatedPlace);
        return res.status(201).json({ success: true });
    } catch (error) {
        next(error);
    }
}

async function deletePlace(req: Request, res: Response, next: NextFunction) {
    const userId = req.session.passport.user;
    const placeId = req.params.placeId;
    try {
        const user = await userDbController.get(userId);
        if (!user.places.includes(placeId as any)) throw new UnauthorizedAccess();

        await placeDbController.delete(user, placeId);
        return res.status(200).json({ success: true, result: "Place removed" });
    } catch (error) {
        next(error);
    }
}

export default {
    deletePlace,
    getPlaces,
    createPlace,
    updatePlace,
};