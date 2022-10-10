import express from "express";
import placeController from "../controllers/places";

const router = express.Router({ mergeParams: true });

router.post("/", placeController.createPlace);
router.get("/", placeController.getPlaces);
router.patch("/:placeId", placeController.updatePlace);
router.delete("/:placeId", placeController.deletePlace);

export default router;