import { getModelForClass, modelOptions, post, pre, prop, Ref, Severity } from "@typegoose/typegoose";
import mongoose from "mongoose";
import TrackModel, { Track } from "./track";
import { User } from "./user";

@pre<Trip>("remove", async function () {
    try {
        const result = await TrackModel.deleteMany({ parentTrip: this._id }).exec();
    } catch (error) {
        console.log("User's post hook error", error);
    }
})
@modelOptions({ options: { allowMixed: Severity.ERROR }, schemaOptions: { timestamps: true } })
export class Trip {
    @prop({ required: true, ref: "User" })
    public author!: Ref<User>;
    
    @prop({ required: true })
    public name!: string;
    
    @prop({ required: true, ref: () => Track })
    public tracks!: mongoose.Types.Array<Ref<Track>>;
}

const TripModel = getModelForClass(Trip);

export default TripModel; 