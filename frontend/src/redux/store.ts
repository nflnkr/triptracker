import { configureStore } from "@reduxjs/toolkit";
import { placesReducer } from "./placesSlice";
import { tripsReducer } from "./tripsSlice";
import { userReducer } from "./userSlice";

export const store = configureStore({
    reducer: {
        user: userReducer,
        trips: tripsReducer,
        places: placesReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        immutableCheck: { warnAfter: 512 },
        serializableCheck: { warnAfter: 512 }
    })
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;