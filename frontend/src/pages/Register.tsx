import { useFormik } from "formik";
import {
    Box,
    Container,
    Avatar,
    Typography,
    TextField,
    Button,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect } from "react";
import { useAppSelector } from "../redux/hooks";

interface Values {
    username: string;
    password: string;
}

export default function SignIn() {
    const user = useAppSelector(state => state.user);
    const navigate = useNavigate();

    const isLoggedIn = Boolean(user);
    const formik = useFormik<Values>({
        initialValues: {
            username: "",
            password: "",
        },
        validate,
        onSubmit: async (values: Values, { setSubmitting }) => {
            const data = new FormData();
            data.append("username", values["username"]);
            data.append("password", values["password"]);
            // TODO handle errors
            const result = await fetch("/api/auth/register", {
                method: "post",
                body: data,
                credentials: "include"
            });
            const json = await result.json();
            console.log("Result json: ", json);
            if (json.success === true) {
                navigate("/login");
            }
            setSubmitting(false);
        }
    });

    useEffect(() => {
        if (isLoggedIn) navigate("/trips");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn]);

    return (
        <Container maxWidth="xs">
            <Box sx={{
                marginTop: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}>
                <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Sign up
                </Typography>
                <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        value={formik.values.username}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.username && Boolean(formik.errors.username)}
                        helperText={formik.touched.username && formik.errors.username}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.password && Boolean(formik.errors.password)}
                        helperText={formik.touched.password && formik.errors.password}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Sign Up
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

function validate(values: Values) {
    const errors = {} as any;
    if (!values.username) {
        errors.username = "Required";
    } else if (!/^[\w-]{3,25}$/i.test(values.username)) {
        errors.username = "Invalid username";
    }
    if (!values.password) {
        errors.password = "Required";
    } else if (!/^[\w-]{8,25}$/i.test(values.password)) {
        errors.password = "Invalid password";
    }
    return errors;
}
