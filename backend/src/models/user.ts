import { getModelForClass, modelOptions, pre, prop, Ref, Severity } from "@typegoose/typegoose";
import mongoose from "mongoose";
import PlaceModel, { Place } from "./place";
import TripModel, { Trip } from "./trip";

@pre<User>('remove', async function () {
    try {
        const trips = await TripModel.find({ author: this._id }).exec();
        const places = await PlaceModel.find({ author: this._id }).exec();
        for (let trip of trips) {
            trip.remove();
        }
        for (let place of places) {
            place.remove();
        }
    } catch (error) {
        console.log("User's post hook error", error);
    }
})
@modelOptions({ options: { allowMixed: Severity.ERROR }, schemaOptions: { timestamps: true } })
export class User {
    @prop({ required: true, unique: true })
    public username!: string;
    
    @prop({ required: true, ref: () => Trip })
    public trips!: mongoose.Types.Array<Ref<Trip>>;
    
    @prop({ required: true, ref: () => Place })
    public places!: mongoose.Types.Array<Ref<Place>>;
    
    @prop({ required: true })
    public password!: string;
}

const UserModel = getModelForClass(User);

export default UserModel;

// for passport.js user deserialization typings
interface IUser extends User {
    _id?: string;
}

declare global {
    namespace Express {
        interface User extends IUser {}
    }
}