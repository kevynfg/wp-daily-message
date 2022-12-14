import { CronJob } from 'cron';
import { getMoonPhase } from "../services/getMoonPhase";
import { sendMessage } from "../server";

export const cronJob = new CronJob({
    cronTime: '* * * * *', 
    // cronTime: '1 6 * * *', 
    onTick: async () => {
        console.log('Running Cron Job for daily message...')
        await sendMessage("Teste cron job");
        await getMoonPhase();
        console.log('** Cron Job Finished **')
    }
});