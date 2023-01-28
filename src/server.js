const dotenv = require("dotenv");
dotenv.config();

const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { CronJob } = require("cron");
const { getWeather } = require("./useCases/weather");
const moment = require("moment");
const { google } = require("googleapis");
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
    organization: process.env.ORGANIZATION_ID,
    apiKey: process.env.OPENAI_KEY,
});

const openai = new OpenAIApi(configuration);

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

const { WP_CONTACT, GROUP_ID } = process.env;

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
    const iaCommands = {
        davinci3: "/bot",
    };
    if (!message || !from) return;

    console.log('Message: ',message);
    if (String(from) === WP_CONTACT) {
        if (message) {
            const msgCommand = message.substring(0, message.indexOf(" "));
            if (msgCommand && msgCommand === iaCommands.davinci3) {
                getDavinciResponse(msgCommand.substring(msgCommand.indexOf(" "))).then((response) => {
                    client.sendMessage(incomingMessage.from === WP_CONTACT ? incomingMessage.to : incomingMessage.from, response);
                });
            };
        }
    }
});

client.on("message_create", async (incomingMessage) => {
    const { body: message, from } = incomingMessage;

    if (!message || !from) return;

    const msgCommand = message;
    if (msgCommand && msgCommand === "/sticker" && incomingMessage.id.remote.includes(GROUP_ID)) {
        const sender = message.includes(WP_CONTACT) ? incomingMessage.to : incomingMessage.from;
        generateSticker(incomingMessage, sender);
    }
})

const generateSticker = async (message, sender) => {
    if (message.type === 'image') {
        try {
            const { data } = await message.downloadMedia();
            const image = await new MessageMedia("image/jpeg", data, "image/jpg");
            await client.sendMessage(sender, image, {sendMediaAsSticker});
        } catch (error) {
            console.error("Deu ruim em processar essa imagem enviada");
            message.reply("Erro ao processar seu arquivo, D:")
        }
    } else {
        try {
            const url = msg.body.substring(msg.body.indexOf(" ")).trim()
            const { data } = await axios.get(url, {responseType: 'arraybuffer'})
            const returnedB64 = Buffer.from(data).toString('base64');
            const image = await new MessageMedia("image/jpeg", returnedB64, "image.jpg")
            await client.sendMessage(sender, image, { sendMediaAsSticker: true })
        } catch (error) {
            console.error("Deu ruim em processar essa imagem enviada pela URL");
            message.reply("Erro ao processar seu arquivo, verifique a URL enviada:")
        }
    }
};

client.on("disconnected", () => {
    console.log("Whatsapp bot lost connection");
    try {
        console.log("Trying to reconnect...");
        client.initialize();
    } catch (error) {
        console.error(error);
        console.log("Bot died... :(");
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

const fetchDailyCalendarEvent = async () => {
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
                if (result.data.items && result.data.items.length) {
                    for (const event of result.data.items) {
                        
                        const { status, created, summary, start = event.start.date || event.start.dateTime, end = event.end.date || event.end.dateTime, hangoutLink = null } = event;
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
                                    return `\n\nCriado em: *${event.created}*, \n\nDescrição: *${event.summary}*, \n\nInício: *${event.start}*${event.end ?", \n\nFim: *"+event.end+"*" : null}, \n\nLink HangOut: *${event.link}*`;
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
}

const fetchDailyForecast = async () => {
    const forecast = await getWeather();
    if (forecast) {
        await client.sendMessage(
            WP_CONTACT,
            `_Previsão do Tempo de Hoje_:
            ${
            `\nDia: *${moment(forecast.date).format("DD/MM/YYYY")}*, \n\nMáxima: *${forecast.day.maxtemp} Cº*, \n\nMínima: *${forecast.day.mintemp} Cº*, \n\nCondição: *${forecast.day.condition}*`
             }
            `
        );
    }
}

const getDavinciResponse = async (clientText) => {
    const options = {
        model: "text-davinci-003", // Modelo GPT a ser usado
        prompt: clientText, // Texto enviado pelo usuário
        temperature: 1, // Nível de variação das respostas geradas, 1 é o máximo
        max_tokens: 4000 // Quantidade de tokens (palavras) a serem retornadas pelo bot, 4000 é o máximo
    }

    try {
        const response = await openai.createCompletion(options)
        let botResponse = ""
        response.data.choices.forEach(({ text }) => {
            botResponse += text
        })
        return `Chat GPT:\n\n ${botResponse.trim()}`
    } catch (error) {
        return `OpenAI Response Error: ${error.response.data.error.message}`
    }
}

const cronJob = new CronJob("1 6 * * *", async function () {
    try {
        console.log("Running Cron Job for daily message...");
        let calendarEventCronJob = 'calendar fetch failed';
        let weatherApiCronJob = 'weather failed to fetch';
        try {
            await fetchDailyCalendarEvent();
            calendarEventCronJob = 'calendar fetch succeeded';
        } catch (error) {
            console.error('Calendar fetch event failed', error);
        }

        try {
            await fetchDailyForecast();
            weatherApiCronJob = "weather api fetched with success"
        } catch (error) {
            console.error('Failed to fetch Daily Weather', error)
        }

        console.log(`** Cron Job Finished for services: ${weatherApiCronJob}, ${calendarEventCronJob}**`);
    } catch (error) {
        console.error(error);
    }
});

client.initialize();