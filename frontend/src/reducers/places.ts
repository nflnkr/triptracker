import { PointOfInterest } from "../types/models";

export type PlacesReducerAction =
    | { type: "set"; payload: { places: PointOfInterest[] | null; }; }
    | { type: "add"; payload: { newPlace: PointOfInterest; }; }
    | { type: "change"; payload: { index: number; newPlace: PointOfInterest; }; }
    | { type: "delete"; payload: { index: number; }; };

export default function placesReducer(prevPlaces: PointOfInterest[] | null, action: PlacesReducerAction) {
    let newPlaces: PointOfInterest[] | null = null;
    switch (action.type) {
        case "set":
            newPlaces = action.payload.places;
            break;
        case "add":
            if (prevPlaces) newPlaces = [...prevPlaces, action.payload.newPlace];
            else newPlaces = [action.payload.newPlace];
            break;
        case "change":
            newPlaces = [];
            if (!prevPlaces) return null;
            prevPlaces.forEach((place, index) => {
                if (index === action.payload.index) newPlaces!.push(action.payload.newPlace);
                else newPlaces!.push(place);
            });
            break;
        case "delete":
            newPlaces = [];
            if (!prevPlaces) return null;
            prevPlaces.forEach((place, index) => {
                if (index !== action.payload.index) newPlaces!.push(place);
            });
            break;
    }    
    return newPlaces;
};