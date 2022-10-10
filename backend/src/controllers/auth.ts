import { Request, Response, NextFunction } from "express";
import UserModel from "../models/user";
import bcrypt from "bcrypt";
import passport from "passport";

async function register(req: Request, res: Response, next: NextFunction) {
    const { username, password } = req.body;

    if (!username || !/^\w{3,25}$/.test(username)) return res.status(500).json({ error: "Username doesnt match the requirements" });
    if (!password || !/^\w{8,25}$/.test(password)) return res.status(500).json({ error: "Password doesnt match the requirements" });

    try {
        const user = await UserModel.findOne({ username }).exec();
        if (user !== null) return res.status(500).json({ error: "Username already taken" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new UserModel({
            username,
            password: hashedPassword,
            trips: []
        });
        await newUser.save();
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(201).json({ error });
    }
}

async function login(req: Request, res: Response, next: NextFunction) {
    passport.authenticate("local", (error, user, info) => {
        if (!user || error) return res.status(401).json({ error, info });
        req.login(user, (error) => {
            if (error) return res.status(500).json({ error });
            return res.status(200).json({
                success: true,
                result: "Login successfull",
                user: {
                    username: user.username,
                    trips: user.trips
                }
            });
        });
    })(req, res, next);
}

function logout(req: Request, res: Response, next: NextFunction) {
    req.logout(err => {
        if (err) return res.status(500).json({ error: err });
        res.status(200).json({ result: "Logout successful" });
    });
}

function checkAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: "Not authenticated" });
}

function checkNotAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) return res.status(404).json({ error: "Already authenticated" });
    next();
}

export default {
    checkAuthenticated,
    checkNotAuthenticated,
    login,
    register,
    logout
};