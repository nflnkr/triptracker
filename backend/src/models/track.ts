import { getModelForClass, modelOptions, prop, Ref, Severity } from "@typegoose/typegoose";
import { Trip } from "./trip";
import config from "../config/config";

@modelOptions({ options: { allowMixed: Severity.ERROR } })
export class Track {
    @prop({ ref: "Trip" })
    public parentTrip!: Ref<Trip>;

    @prop({ required: true, default: config.trackDefaults.type })
    public type!: string;

    @prop({ required: true, default: config.trackDefaults.color })
    public color!: string;
    
    @prop({ required: true, type: String, default: [] })
    public trackpoints!: string[];
}

const TrackModel = getModelForClass(Track);

export default TrackModel;
