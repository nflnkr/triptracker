import { Request, Response, NextFunction } from "express";
import UserModel from "../models/user";

async function createUser(req: Request, res: Response, next: NextFunction) {
    const username = req.body.username as string;
    if (!username) return res.status(500).json({ error: "Wrong username" });
    try {
        const newUser = new UserModel({
            username,
            trips: []
        });
        const result = await newUser.save();
        res.status(201).json({ user: result });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

async function getUser(req: Request, res: Response, next: NextFunction) {
    const username = req.user?.username;
    if (!username) return res.status(500).json({ error: "User not found" });

    const user = await UserModel.findOne({ username }, "-__v -_id -createdAt -updatedAt -password").populate("trips", "-__v -createdAt -updatedAt -author -tracks").exec();
    if (!user) return res.status(500).json({ error: "User not found" });

    if (req.user) return res.status(200).json({ user });
}

async function getUserByName(req: Request, res: Response, next: NextFunction) {
    try {
        const result = await UserModel.findOne({ username: req.params.username }).exec();
        if (result === null) return res.status(404).json({ error: "User not found" });
        return res.status(200).json({ user: result });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

async function updateUser(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await UserModel.findOne({ username: req.params.username }).exec();
        // TODO user info change handle
        return res.status(200).json({ result: "not implemented" });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

async function deleteUserByName(req: Request, res: Response, next: NextFunction) {
    const username = req.params.username;
    try {
        const user = await UserModel.findOne({ username }).exec();
        user?.remove();
        res.status(200).json({ result: "User deleted" });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

export default {
    getUser,
    deleteUserByName,
    createUser,
    updateUser,
    getUserByName,
};