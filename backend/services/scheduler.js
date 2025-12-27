/**
 * CURIO BACKEND - Scheduler Service
 * ✅ Täglich um 00:01 CET neue Daily Content
 * ✅ Täglich Limits Reset
 * ✅ Premium Expiration Check
 */

const cron = require('node-cron');
const { runDailyTasks, getTodayDateCET } = require('./daily-content');

let schedulerStarted = false;

// =====================================================
// START SCHEDULER
// =====================================================

function startScheduler() {
    if (schedulerStarted) {
        console.log('⚠️ Scheduler already running');
        return;
    }
    
    console.log('🕐 Starting scheduler...');
    
    // Run daily at 00:01 CET
    // Cron format: minute hour day month weekday
    // Note: Cron uses server time, so we need to account for timezone
    // CET is UTC+1 (winter) or UTC+2 (summer)
    // We'll run at 23:01 UTC to cover CET 00:01
    
    cron.schedule('1 23 * * *', async () => {
        console.log('⏰ Scheduled task triggered (23:01 UTC)');
        await runDailyTasks();
    }, {
        timezone: 'Europe/Berlin'  // This handles DST automatically!
    });
    
    // Also schedule at 00:01 Berlin time directly
    cron.schedule('1 0 * * *', async () => {
        console.log('⏰ Scheduled task triggered (00:01 CET)');
        await runDailyTasks();
    }, {
        timezone: 'Europe/Berlin'
    });
    
    schedulerStarted = true;
    console.log('✅ Scheduler started - Daily tasks at 00:01 CET');
    console.log(`📅 Current date (CET): ${getTodayDateCET()}`);
}

// =====================================================
// MANUAL TRIGGER (for testing)
// =====================================================

async function triggerDailyTasks() {
    console.log('🔧 Manual trigger: Running daily tasks...');
    return await runDailyTasks();
}

// =====================================================
// CHECK IF SCHEDULER IS RUNNING
// =====================================================

function isSchedulerRunning() {
    return schedulerStarted;
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    startScheduler,
    triggerDailyTasks,
    isSchedulerRunning
};