import { useFormik } from "formik";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
    Box,
    Container,
    Avatar,
    Typography,
    TextField,
    Button,
    Link,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useContext, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { setUser } from "../redux/userSlice";

interface Values {
    username: string;
    password: string;
}

type PasswordState = undefined | "error" | "success";

export default function Login() {
    const user = useAppSelector(state => state.user);
    const dispatch = useAppDispatch();
    const [passwordState, setPasswordState] = useState<PasswordState>(undefined);
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
            const result = await fetch("/api/auth/login", {
                method: "post",
                body: data,
                credentials: "include"
            });
            const json = await result.json();
            console.log("Result json: ", json);
            if (json.success === true) {
                dispatch(setUser(json.user))
                setPasswordState("success");
                setTimeout(() => navigate("/trips"), 1000);
            } else {
                setPasswordState("error");
                setTimeout(() => setPasswordState(undefined), 3000);
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
                    Sign in
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
                        color={passwordState}
                        sx={{ mt: 3, mb: 2 }}
                        disabled={formik.isSubmitting}
                    >
                        Sign In
                    </Button>
                </Box>
                <Box sx={{
                    display: "flex",
                    justifyContent: "center"
                }}>
                    <Link
                        component={RouterLink}
                        to="/register"
                        variant="body2"
                    >
                        {"Don't have an account? Sign Up"}
                    </Link>
                </Box>
            </Box>
        </Container>
    )
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
