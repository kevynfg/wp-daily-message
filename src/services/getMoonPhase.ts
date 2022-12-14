// import fetch from 'node-fetch';
// import axios from 'axios';
import http from 'https';

export const getMoonPhase = async () => {
    let moonPhase;
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from("d967542c-46c3-4a42-b82d-4e7d7884af3e"+":"+"c8c980ba6abfcd7ffac1ff022bbaf1ba1889c4b71118f3b27fbb378e1400e5cd9f1e01d7319c48357dcf60093ab8cb3daf0b3a8fefa1b4a66578cf81da4db6978e976a1ba8ed6c99cd649a18fa61f26a2a50fb8c24a16c36132abc4436d381996aec47dad3a853eacf972a9d9a45de5f", "utf-8").toString("base64")}`
        }
    }
    const response = http.request(options, (res) => {
        res.on('data', (d) => {
            moonPhase = d;
        })
    })
    response.write(JSON.stringify({
        "format": "png",
        "observer": {
            "latitude": -23.9692514,
            "longitude": -46.3894121,
            "date": "2022-12-11"
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
    }))
    response.end();
    console.log('moon phase', moonPhase);
    return moonPhase;
}