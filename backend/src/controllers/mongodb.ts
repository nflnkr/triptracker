import PlaceModel from "../models/place";
import TrackModel from "../models/track";
import TripModel from "../models/trip";
import UserModel from "../models/user";
import { UserDbController, TripDbController, PlaceDbController } from "../utils/dbControllers";


export const userDbController = new UserDbController(UserModel);
export const tripDbController = new TripDbController(TripModel, TrackModel);
export const placeDbController = new PlaceDbController(PlaceModel);