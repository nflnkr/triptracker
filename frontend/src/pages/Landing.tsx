import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/user";
import { Container } from "@mui/material";

export default function Home() {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        // navigate("/dashboard");
    });

    return (
        <Container>Some average landing page</Container>
    );
}