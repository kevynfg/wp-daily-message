"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const whatsapp_web_js_1 = require("whatsapp-web.js");
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const sendDailyMessage_1 = require("./routines/sendDailyMessage");
const client = new whatsapp_web_js_1.Client({
    puppeteer: {
        args: ['--no-sandbox']
    },
    authStrategy: new whatsapp_web_js_1.LocalAuth()
});
client.on('qr', (qr) => __awaiter(void 0, void 0, void 0, function* () {
    qrcode_terminal_1.default.generate(qr, { small: true });
    console.log(`QR RECEIVED`, qr);
}));
client.on('ready', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Client ready !');
    sendDailyMessage_1.cronJob.start();
}));
client.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('message body', message.body);
    console.log('message from', message.from);
}));
client.on('disconnected', () => {
    console.log('Whatsapp bot lost connection');
    try {
        console.log('Trying to reconnect...');
        client.initialize();
    }
    catch (error) {
        console.error(error);
    }
});
const sendMessage = (message) => __awaiter(void 0, void 0, void 0, function* () {
    yield client.sendMessage(String(process.env.WP_CONTACT), message);
});
exports.sendMessage = sendMessage;
client.initialize();
//# sourceMappingURL=server.js.map