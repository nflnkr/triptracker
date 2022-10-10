import { Container, CssBaseline, ThemeProvider } from "@mui/material";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Trips";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import Register from "./pages/Register";
// import Trip from "./pages/Trip";
import { UserContext } from "./contexts/user";
import { User } from "./types/models";
import theme from "./contexts/muiTheme";
import CreateTrip from "./pages/CreateTrip";
import NotFound from "./pages/NotFound";
import PageLoading from "./components/PageLoading";
import Places from "./pages/Places";
import Trips from "./pages/Trips";

const Trip = lazy(() => import("./pages/Trip"));

export default function App() {
    const [user, setUser] = useState<User | null>(null);

    const getUserData = useCallback(() => {
        // TODO handle errors
        fetch("/api/user", { credentials: "include" })
            .then(result => result.json())
            .then(json => {
                if (!json.user) return setUser(null);
                setUser(json.user as User);
            });
    }, []);

    useEffect(() => {
        getUserData();
    }, [getUserData]);

    return (
        <ThemeProvider theme={theme}>
            <UserContext.Provider value={{ user, setUser }}>
                <BrowserRouter>
                    <CssBaseline />
                    <Navbar />
                    <Container maxWidth={false} sx={{ pt: 2 }}>
                        <Suspense fallback={<PageLoading />}>
                            <Routes>
                                <Route path="/" element={<Landing />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                {user && <Route path="/trips" element={<Trips />} />}
                                <Route path="/trip/:tripId" element={<Trip />} />
                                {user && <Route path="/places" element={<Places />} />}
                                {user && <Route path="/create" element={<CreateTrip />} />}
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Suspense>
                    </Container>
                </BrowserRouter>
            </UserContext.Provider>
        </ThemeProvider >
    );
}