import * as dotenv from 'dotenv';
dotenv.config();
import { z } from 'zod';
import { Client, LocalAuth } from "whatsapp-web.js"
import qrcode from 'qrcode-terminal';
import { cronJob } from "./routines/sendDailyMessage";
import { getMoonPhase } from "./services/getMoonPhase";

const envSchema = z.object({
    WP_CONTACT: z.string(),
})

const { WP_CONTACT } = envSchema.parse(process.env);

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
    const messageSchema = z.object({
        body: z.string(),
        from: z.string(),
    })

    const { body: message, from } = messageSchema.parse(incomingMessage);
    
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

export const sendMessage = async (message: string) => {
    await client.sendMessage(WP_CONTACT, message)
}

client.initialize();