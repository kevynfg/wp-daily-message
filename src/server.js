const dotenv = require("dotenv");
dotenv.config();

const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { CronJob } = require("cron");
const { getMoonPhase } = require("./services/getMoonPhase");
const moment = require("moment");
const { google } = require("googleapis");

const { GOOGLE_JSON } = process.env;
const parsedJson = JSON.parse(GOOGLE_JSON);

const SCOPES = process.env.SCOPES;
const GOOGLE_PRIVATE_KEY = parsedJson.private_key;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PROJECT_NUMBER = process.env.GOOGLE_PROJECT_NUMBER;
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

const jwtClient = new google.auth.JWT(GOOGLE_CLIENT_EMAIL, null, GOOGLE_PRIVATE_KEY, SCOPES);

const calendar = google.calendar({
    version: "v3",
    project: GOOGLE_PROJECT_NUMBER,
    auth: jwtClient,
});

const { WP_CONTACT } = process.env;

const client = new Client({
    puppeteer: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
    authStrategy: new LocalAuth(),
});

client.on("qr", async (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
    console.log("Whatsapp Client ready...!!");
    cronJob.start();
});

const checkForDifferentDates = (date) => {
    return date.length > 10 ? date.slice(0, 10) : date;
};

client.on("message", async (incomingMessage) => {
    const { body: message, from } = incomingMessage;
    
    if (!message || !from) return;

    if (String(from) === WP_CONTACT) {
        if (message && message === "daily") {
            const { transcript } = await getMoonPhase();
            const [_, date, moonPhase] = transcript.split("\n");
            const formatDate = moment(new Date(date), "DD/MM/YYYY").utc().locale("pt-br");
            const fullDate = formatDate.format("DD [de] MMM [de] YYYY");

            calendar.events.list(
                {
                    calendarId: GOOGLE_CALENDAR_ID,
                    timeMin: new Date().toISOString(),
                    maxResults: 10,
                    singleEvents: true,
                    orderBy: "startTime",
                },
                async (error, result) => {
                    if (error) {
                        console.log(JSON.stringify({ error: error }));
                    } else {
                        let calendarEvents = [];
                        if (result.data.items.length) {
                            for (const event of result.data.items) {
                                const {
                                    status,
                                    created,
                                    summary,
                                    start = event.start.date || event.start.dateTime,
                                    end = event.end.date || event.end.dateTime,
                                    hangoutLink = null,
                                } = event;
        
                                const validatedDate = start.dateTime ? start.dateTime : start.date;
        
                                if (
                                    validatedDate &&
                                    moment(checkForDifferentDates(validatedDate)).isSame(new Date().toISOString().slice(0, 10))
                                ) {
                                    calendarEvents.push({
                                        status: status.includes("confirmed") ? "Confirmado" : status,
                                        created: created
                                            ? moment(checkForDifferentDates(created)).utc().format("DD/MM/YYYY")
                                            : "Sem data de criação",
                                        summary,
                                        start: validatedDate
                                            ? moment(checkForDifferentDates(validatedDate)).utc().format("DD/MM/YYYY")
                                            : "Sem data de Início",
                                        end: end
                                            ? moment(checkForDifferentDates(end)).utc().format("DD/MM/YYYY")
                                            : "Sem data fim",
                                        link: hangoutLink || "Sem link do meet",
                                    });
                                }
                            }
        
                            if (calendarEvents && calendarEvents.length > 0) {
                                await client.sendMessage(
                                    WP_CONTACT,
                                    `_Eventos do Dia_:
                                    ${calendarEvents
                                        .map((event) => {
                                            return `\nStatus: *${event.status}*, Criado em: *${event.created}*, Descrição: *${event.summary}*, Início: *${event.start}*, Fim: *${event.end}*, Link HangOut: *${event.link}*`;
                                        })
                                        .join(" ")}
                                    `
                                );
                            }
                        } else {
                            console.log(JSON.stringify({ message: "No upcoming events found." }));
                        }
                    }
                }
            );

            await client.sendMessage(
                WP_CONTACT,
                `_Fase da Lua_: \nData: *${fullDate}*, \nLua: *${transcriptMoonPhase(moonPhase)}*`
            );
        }
    }
});

client.on("disconnected", () => {
    console.log("Whatsapp bot lost connection");
    try {
        console.log("Trying to reconnect...");
        client.initialize();
    } catch (error) {
        console.error(error);
    }
});

const transcriptMoonPhase = (phase) => {
    return phase.includes("Waxing") ? "Crescente" : "Minguante";
};

const sendWhatsappMessage = async (message, isMoonPhase = false) => {
    const [_, date, moonPhase] = message.split("\n");
    const formatDate = moment(new Date(date), "DD/MM/YYYY").utc().locale("pt-br");
    const fullDate = formatDate.format("DD [de] MMM [de] YYYY");
    await client.sendMessage(
        WP_CONTACT,
        `_Fase da Lua_: \nData: *${fullDate}*, \nLua: *${transcriptMoonPhase(moonPhase)}*`
    );
};

const cronJob = new CronJob("1 6 * * *", async function () {
    try {
        console.log("Running Cron Job for daily message...");
        const {imageUrl, transcript} = await getMoonPhase();
        await sendWhatsappMessage(transcript);
        console.log("** Cron Job Finished **");
    } catch (error) {
        console.error(error);
    }
});

client.initialize();