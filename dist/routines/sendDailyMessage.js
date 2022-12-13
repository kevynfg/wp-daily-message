"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronJob = void 0;
const cron_1 = require("cron");
const server_1 = require("../server");
exports.cronJob = new cron_1.CronJob({
    cronTime: '* * * * *',
    onTick: () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Running Cron Job for daily message...');
        yield (0, server_1.sendMessage)("Teste cron job");
        console.log('Cron Job Finished');
    })
});
//# sourceMappingURL=sendDailyMessage.js.map