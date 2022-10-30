import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PointOfInterest, User } from "../types/models";

const initialState = [] as PointOfInterest[];

export const placesSlice = createSlice({
    name: "places",
    initialState,
    reducers: {
        setPlaces: (state: PointOfInterest[], action: PayloadAction<PointOfInterest[]>) => {
            return action.payload;
        },
        addPlace: (state: PointOfInterest[], action: PayloadAction<PointOfInterest>) => {
            if (state) return [...state, action.payload];
            else return [action.payload];
        },
        changePlace: (state: PointOfInterest[], action: PayloadAction<{ id: string; newPlace: PointOfInterest; }>) => {
            const newPlaces: PointOfInterest[] = [];
            if (!state?.length) return [];
            state.forEach(place => {
                if (place.id === action.payload.id) newPlaces.push(action.payload.newPlace);
                else newPlaces.push(place);
            });
            return newPlaces;
        },
        removePlace: (state: PointOfInterest[], action: PayloadAction<string>) => {
            const newPlaces: PointOfInterest[] = [];
            if (!state?.length) return [];
            state.forEach(place => {
                if (place.id !== action.payload) newPlaces.push(place);
            });
            return newPlaces;
        },
    },
});

export const { setPlaces, addPlace, changePlace, removePlace } = placesSlice.actions;

export const placesReducer = placesSlice.reducer;