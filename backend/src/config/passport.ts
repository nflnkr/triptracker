import { PassportStatic } from "passport";
import { Strategy as LocalStrategy, VerifyFunction } from "passport-local";
import UserModel, { User } from "../models/user";
import bcrypt from "bcrypt";

export default function initializePassport(passport: PassportStatic) {
    const authenticateUser: VerifyFunction = async (username, password, done) => {
        try {
            const user = await UserModel.findOne({ username }).populate("trips").exec();
            if (user === null) return done(null, false, { message: "No user found" });
            if (await bcrypt.compare(password, user.password)) {
                return done(null, {
                    _id: user._id,
                    username: user.username,
                    trips: user.trips
                });
            } else {
                return done(null, false, { message: "Password incorrect" });
            }
        } catch (error) {
            console.log("Verifying user error", error);
            return done(error);
        }
    }

    passport.use(new LocalStrategy({ usernameField: "username" }, authenticateUser));

    passport.serializeUser((user, done) => done(null, user._id));

    passport.deserializeUser(async (id, done) => {
        const user = await UserModel.findOne({ _id: id }).select("-password -__v").populate("trips").exec();
        if (!user) return done({ message: "No user found" }, false);
        return done(null, {
            username: user.username,
            trips: user.trips
        } as User);
    });
}
