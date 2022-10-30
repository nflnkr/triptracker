import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../types/models";

type UserOrNull = User | null;

const initialState = null as UserOrNull;

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser: (state: UserOrNull, action: PayloadAction<UserOrNull>) => {
            return action.payload;
        }
    },
});

export const { setUser } = userSlice.actions;

export const userReducer = userSlice.reducer;