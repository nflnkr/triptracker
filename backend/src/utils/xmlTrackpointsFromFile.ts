import X2JS from "x2js";

const converter = new X2JS();

export function xmlTrackpointsFromFile(file: Express.Multer.File) {
    const fileBuffer = file.buffer;
    const fileString = fileBuffer.toString();
    const trackObj = converter.xml2js(fileString) as any;
    const tracksegments = trackObj.gpx?.trk?.trkseg as any;
    let xmlTrackpoints = [] as any[];

    if (Array.isArray(tracksegments)) tracksegments.forEach(tracksegment => xmlTrackpoints.push(...tracksegment.trkpt));
    else xmlTrackpoints = tracksegments.trkpt;
    if (!xmlTrackpoints) throw new Error("Error parsing file, no trackpoints");
    return xmlTrackpoints;
}