const request = require('request-promise');
const { createWorker } = require('tesseract.js');

const getMoonPhase = async () => {
    const today = new Date(Date.now()).toISOString().slice(0, 10);
    const response = await request.post({
        method: 'POST',
        uri: `${process.env.ASTRONOMY_API_URL}`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(String(`${process.env.ASTRONOMY_APPLICATION_ID}:${process.env.ASTRONOMY_APPLICATION_SECRET}`), "utf-8").toString("base64")}` 
        },
        body: {
            "format": "png",
            "observer": {
                "latitude": -23.9692514,
                "longitude": -46.3894121,
                "date": today ? today : new Date(),
            },
            "style": {
                "moonStyle": "default",
                "backgroundStyle": "stars",
                "backgroundColor": "white",
                "headingColor": "white",
                "textColor": "white"
            },
            "view": {
                "type": "landscape-simple",
                "orientation": "south-up"
            }
        },
        timeout: 2000000,
        rejectUnauthorized: false,
        json: true
    });
    const {data: { imageUrl }} = response;
    const transcript = await makeWorker(imageUrl);
    return {imageUrl, transcript};
};

const makeWorker = async(image) => {
    const worker = await createWorker()

    console.log(`Starting Tesseract...`)
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(image);
    await worker.terminate();
    console.log(`Finished Tesseract...`);
    return text;
}

module.exports.getMoonPhase = getMoonPhase;