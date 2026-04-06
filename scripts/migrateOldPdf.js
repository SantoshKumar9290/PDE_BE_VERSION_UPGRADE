const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const OLD_SERVER_BASE_URL = process.env.STATIC_PATH_PDf;
const DESTINATION_BASE_PATH = path.join(process.cwd(), 'pdfs');

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const CONCURRENCY_LIMIT = 5; // number of parallel downloads

if (!OLD_SERVER_BASE_URL) {
    console.error("OLD_SERVER_BASE_URL is not defined in environment variables.");
    process.exit(1);
}

/**
 * Utility: Sleep function
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Download & Save File with Retry Logic
 */
async function migrateFile(relativePath, attempt = 1) {
    const fileUrl = `${OLD_SERVER_BASE_URL}/${relativePath}`;
    const localPath = path.join(DESTINATION_BASE_PATH, relativePath);

    try {
        const response = await axios({
            url: fileUrl,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: 30000
        });

        // Ensure directory exists
        await fs.mkdir(path.dirname(localPath), { recursive: true });

        // Write file
        await fs.writeFile(localPath, response.data);

        console.log(`Migrated: ${relativePath}`);
        return true;

    } catch (err) {
        console.error(`Attempt ${attempt} Failed: ${relativePath}`);

        if (attempt < MAX_RETRIES) {
            console.log(`Retrying ${relativePath} in ${RETRY_DELAY / 1000}s...`);
            await sleep(RETRY_DELAY);
            return migrateFile(relativePath, attempt + 1);
        }

        console.error(`Final Failure: ${relativePath}`);
        return false;
    }
}

/**
 * Process Files in Batches (Concurrency Control)
 */
async function processInBatches(files, concurrencyLimit) {
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < files.length; i += concurrencyLimit) {
        const batch = files.slice(i, i + concurrencyLimit);

        const results = await Promise.all(
            batch.map(file => migrateFile(file))
        );

        results.forEach(result => {
            if (result) successCount++;
            else failureCount++;
        });

        console.log(`Progress: ${successCount} Success | ${failureCount} Failed | ${i + batch.length}/${files.length}`);
    }

    return { successCount, failureCount };
}

/**
 * Main Execution
 */
(async () => {
    try {
        const files = require('./filelist.json');

        console.log(`Starting Migration of ${files.length} files...`);

        const { successCount, failureCount } = await processInBatches(
            files,
            CONCURRENCY_LIMIT
        );

        console.log("\n==============================");
        console.log("Migration Complete");
        console.log(`Successful: ${successCount}`);
        console.log(`Failed: ${failureCount}`);
        console.log("==============================\n");

    } catch (err) {
        console.error("Fatal Error:", err.message);
    }
})();
