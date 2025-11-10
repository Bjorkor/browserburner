/**
 * worker.js
 * * This script runs in an infinite loop to stress one CPU core.
 */

try {
    while (true) {
        Math.sqrt(123456789.0);
    }
} catch (e) {
    console.error("Error in stress worker:", e);
}
