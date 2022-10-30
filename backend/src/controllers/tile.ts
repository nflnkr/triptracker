import { Request, Response, NextFunction } from "express";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import axios from "axios";

const tileSourceList = {
    "openstreetmap": `https://tile.openstreetmap.org/{z}/{x}/{y}.png`,
    "thunderforest-cycle": `https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=${process.env.THUNDERFOREST_API_KEY}`,
    "thunderforest-landscape": `https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=${process.env.THUNDERFOREST_API_KEY}`,
    "thunderforest-atlas": `https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=${process.env.THUNDERFOREST_API_KEY}`,
    "thunderforest-neighbourhood": `https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=${process.env.THUNDERFOREST_API_KEY}`,
    "thunderforest-outdoors": `https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=${process.env.THUNDERFOREST_API_KEY}`,
};

const maxZoomLevel = {
    "openstreetmap": 19,
    "thunderforest-cycle": 22,
    "thunderforest-landscape": 22,
    "thunderforest-atlas": 22,
    "thunderforest-neighbourhood": 22,
    "thunderforest-outdoors": 22,
};

const tilesCachePath = path.join(process.cwd(), "/data/tiles");

type MapCache = {
    [Property in keyof typeof tileSourceList]: string[];
};

let cachedTiles = {} as MapCache;

const cacheFolders = fsSync.readdirSync(tilesCachePath);
for (let mapType in tileSourceList) {
    const typeCachePath = path.join(tilesCachePath, mapType);
    if (cacheFolders.includes(mapType)) {
        cachedTiles[mapType as keyof MapCache] = fsSync.readdirSync(typeCachePath);
    } else {
        fsSync.mkdirSync(typeCachePath);
        cachedTiles[mapType as keyof MapCache] = [];
    }
}

// TODO tile expiration control
// TODO retina support
async function getTile(req: Request, res: Response, next: NextFunction) {
    try {
        const mapStyle = req.params.style as keyof MapCache;
        const zoom = Number(req.params.zoom);
        const x = Number(req.params.x);
        const y = Number(req.params.y);

        if (isNaN(zoom) || isNaN(x) || isNaN(y)) return res.status(404).json({ error: "Bad parameters" });
        if (!(mapStyle in cachedTiles)) return res.status(404).json({ error: "Map style not found" });
        if (zoom < 0 || zoom > maxZoomLevel[mapStyle]) return res.status(404).json({ error: "Wrong zoom level" });
        if (x < 0 || x > (2 ** zoom) - 1) return res.status(404).json({ error: "X is out of bounds" });
        if (y < 0 || y > (2 ** zoom) - 1) return res.status(404).json({ error: "Y is out of bounds" });

        const url = tileSourceList[mapStyle].replace("{z}", zoom.toString()).replace("{x}", x.toString()).replace("{y}", y.toString());
        const fileName = `z${zoom}x${x}y${y}.png`;
        const filePath = path.join(tilesCachePath, mapStyle, fileName);

        if (cachedTiles[mapStyle].includes(fileName)) { // serve cached tiles
            const file = await fs.readFile(filePath);
            res.status(200).send(file);
        } else { // fetch tiles, then serve and cache them
            const response = await axios({
                url,
                method: "GET",
                responseType: "arraybuffer",
                headers: {
                    "User-Agent": "Axios 0.27.2"
                }
            });
            const imageBuffer = response.data;
            res.status(200).send(imageBuffer);

            fs.writeFile(filePath, imageBuffer);
            cachedTiles[mapStyle].push(fileName);
        }
    } catch (error) {
        next(error);
    }
}

export default {
    getTile
};