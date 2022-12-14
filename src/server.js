const dotenv = require('dotenv');
dotenv.config();
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require('qrcode-terminal');
const { cronJob } = require("./routines/sendDailyMessage");
const { getMoonPhase } = require("./services/getMoonPhase");

const { WP_CONTACT } = process.env;

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox']
    },
    authStrategy: new LocalAuth()
});

client.on('qr', async (qr) => {
    qrcode.generate(qr, {small: true})
});

client.on('ready', async () => {
    console.log('Client ready !')
    cronJob.start();
});

client.on('message', async (incomingMessage) => {
    const { body: message, from } = incomingMessage;
    
    console.log('message body', message);
    console.log('message from', from);
    
    if (!message || !from) return;

    console.log('wp contact', WP_CONTACT);
    if (String(from) === WP_CONTACT) {
        if (message && message === "daily") {
            console.log('needs daily data');
            const phase = await getMoonPhase();
            await client.sendMessage(WP_CONTACT, `"Mensagem do BOT: \n${JSON.stringify(phase)}`)
        }
    }
})

client.on('disconnected', () => {
    console.log('Whatsapp bot lost connection');
    try {
        console.log('Trying to reconnect...')
        client.initialize();
    } catch (error) {
        console.error(error);
    }
});

exports.sendMessage = async (message, isMoonPhase = false) => {
    await client.sendMessage(WP_CONTACT, `Mensagem do BOT: \n${isMoonPhase ? 'Fase da lua hoje: ' : null}${message}`)
}

// module.exports = {
//     sendMessage
// }

client.initialize();