import { CronJob } from 'cron';
import { sendMessage } from "../server";

export const cronJob = new CronJob({
    cronTime: '* * * * *', 
    // cronTime: '1 6 * * *', 
    onTick: async () => {
        console.log('Running Cron Job for daily message...')
        await sendMessage("Teste cron job");
        console.log('** Cron Job Finished **')
    }
});