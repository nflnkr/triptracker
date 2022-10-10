import express from "express";
import multer from "multer";
import gpxController from "../controllers/gpx";

const router = express.Router({ mergeParams: true });
const upload = multer();

router.post("/", upload.array("gpxfile", 100), gpxController.uploadGpx);
router.get("/:tripId", gpxController.downloadGpx);

export default router;