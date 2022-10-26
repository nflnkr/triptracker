import { Container, CssBaseline, ThemeProvider } from "@mui/material";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import Register from "./pages/Register";
import { PointOfInterest, Trip } from "./types/models";
import theme from "./contexts/muiTheme";
import CreateTrip from "./pages/CreateTrip";
import NotFound from "./pages/NotFound";
import PageLoading from "./components/PageLoading";
import Places from "./pages/Places";
import Trips from "./pages/Trips";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { setUser } from "./redux/userSlice";
import { processTrip } from "./utils/trackDataCalcs";
import { setTrips } from "./redux/tripsSlice";
import { setPlaces } from "./redux/placesSlice";

const TripPage = lazy(() => import("./pages/Trip"));

export default function App() {
    const user = useAppSelector(state => state.user);
    const dispatch = useAppDispatch();

    useEffect(() => {
        // TODO handle errors
        fetch("/api/user", { credentials: "include" })
            .then(result => result.json())
            .then(json => {
                if (json.user) dispatch(setUser(json.user));
            });
        fetch("/api/trip", { credentials: "include" })
            .then(result => result.json())
            .then(json => {
                const trips = json.trips as Trip[];
                const processedTrips = trips.map(trip => processTrip(trip));
                dispatch(setTrips(processedTrips));
            });
        fetch("/api/places", { credentials: "include" })
            .then(result => result.json())
            .then(json => {
                const places = json.places as PointOfInterest[];
                dispatch(setPlaces(places));
            });
    }, [dispatch]);

    return (
        <ThemeProvider theme={theme}>
            <BrowserRouter>
                <CssBaseline />
                <Navbar />
                <Container maxWidth={false} sx={{ pt: 2 }} component="main" >
                    <Suspense fallback={<PageLoading />}>
                        <Routes>
                            <Route path="/" element={<Landing />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            {user && <Route path="/trips" element={<Trips />} />}
                            <Route path="/trip/:tripId" element={<TripPage />} />
                            {user && <Route path="/places" element={<Places />} />}
                            {user && <Route path="/create" element={<CreateTrip />} />}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </Container>
            </BrowserRouter>
        </ThemeProvider>
    );
}