import { getModelForClass, modelOptions, prop, Ref, Severity } from "@typegoose/typegoose";
import { Trip } from "./trip";
import config from "../config/config";
import { User } from "./user";

@modelOptions({ options: { allowMixed: Severity.ERROR }, schemaOptions: { timestamps: true } })
export class Place {
    @prop({ required: true, ref: "User" })
    public author!: Ref<User>;

    @prop({ required: true })
    public lat!: number;

    @prop({ required: true })
    public lon!: number;

    @prop({ required: false })
    public name!: string;

    @prop({ required: false })
    public description!: string;

    public createdAt!: Date;
}

const PlaceModel = getModelForClass(Place);

export default PlaceModel;
