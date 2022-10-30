import { CircularProgress, Container } from "@mui/material";


export default function PageLoading() {
    return (
        <Container sx={{ mt: 4, textAlign: "center" }}>
            <CircularProgress disableShrink />
        </Container>
    );
}