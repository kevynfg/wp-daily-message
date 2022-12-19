const request = require('request-promise');

const getAstronomyBodies = async (latitude = null, longitude = null) => {
    const today = new Date(Date.now()).toISOString().slice(0, 10);
    const { ASTRONOMY_API_URL, ASTRONOMY_APPLICATION_ID, ASTRONOMY_APPLICATION_SECRET } = process.env;
    
    const astronomyApiResponse = await request.post({
        method: 'POST',
        uri: `${ASTRONOMY_API_URL}`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(String(`${ASTRONOMY_APPLICATION_ID}:${ASTRONOMY_APPLICATION_SECRET}`), "utf-8").toString("base64")}` 
        },
        body: {
            "format": "png",
            "observer": {
                "latitude": latitude ?? -23.9692514,
                "longitude": longitude ?? -46.3894121,
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
    if (astronomyApiResponse && astronomyApiResponse.data) {
        const {data: { imageUrl }} = astronomyApiResponse;
        const imageTranscripted = await makeWorker(imageUrl);
        return imageTranscripted;
    }

    return null;
};