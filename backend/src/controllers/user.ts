import { Request, Response, NextFunction } from "express";
import UserModel from "../models/user";
import { userDbController } from "./mongodb";


async function getUser(req: Request, res: Response, next: NextFunction) {
    if (req.user) return res.status(200).json({ user: req.user });
    return res.status(500).json({ error: "User not found" });
}

async function updateUser(req: Request, res: Response, next: NextFunction) {
    const username = req.user?.username;
    if (!username) return res.status(500).json({ error: "User not found" });

    try {
        const user = await UserModel.findOne({ username: req.params.username }).exec();
        // TODO user info change
        return res.status(200).json({ result: "not implemented" });
    } catch (error) {
        next(error);
    }
}

async function deleteUserByName(req: Request, res: Response, next: NextFunction) {
    const userId = req.session.passport.user;
    try {
        await userDbController.delete(userId);
        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
}

export default {
    getUser,
    deleteUserByName,
    updateUser,
};