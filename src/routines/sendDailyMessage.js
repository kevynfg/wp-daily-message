const { CronJob } = require("cron");
const { getMoonPhase } = require("../services/getMoonPhase");
const sendMessage = require("../server");

exports.cronJob = new CronJob({
    cronTime: '* * * * *', 
    // cronTime: '1 6 * * *', 
    onTick: async () => {
        console.log('Running Cron Job for daily message...')
        // await sendMessage("Teste cron job");
        const imageUrl = await getMoonPhase();
        await sendMessage(imageUrl);
        console.log('** Cron Job Finished **')
    }
});

// module.exports = {
//     cronJob
// }