import createTheme, { ThemeOptions } from "@mui/material/styles/createTheme";

export const themeOptions: ThemeOptions = {
    palette: {
        mode: "light",
        primary: {
            main: "#02749b",
            // main: "#0277bd",
        },
        secondary: {
            main: "#009688",
        },
        background: {
            default: "#e0e0e0",
            paper: "#eeeeee",
        },
        error: {
            main: "#f44336",
        },
    }
};

const theme = createTheme(themeOptions);

export default theme;