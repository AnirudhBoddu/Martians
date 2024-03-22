/**
 * This module is responsible for establishing a connection with a speaker via a WebSocket and processing Martian sentences received from the speaker.
 * It translates Martian sentences into English and handles reconnection attempts in case of connection errors.
 * @module listener
 */

const {io} = require("socket.io-client");
let socketClientConnection;
const logger = require('../utils/logger')('listener');

const SPEAKER_URL = "ws://localhost:3000";

let reconnectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 5;

/**
 * Function to establish connection with the speaker.
 * If the maximum number of reconnection attempts is reached, it logs an error message and returns.
 * It sets up event listeners for various socket events such as 'connect_error', 'connect_timeout', 'error', 'disconnect', 'reconnect', and 'connect'.
 * It also sets up a listener for 'sentence' event to process incoming Martian sentences.
 */
function connectToSpeaker() {
    if (reconnectionAttempts >= MAX_RECONNECTION_ATTEMPTS) {
        logger.info('Max reconnection attempts reached. Please check the speaker.');
        return;
    }

    socketClientConnection = io(SPEAKER_URL, {
        reconnection: false // disable automatic reconnection
    });

    socketClientConnection.on('connect_error', (err) => {
        logger.info('Connection Error', err);
        reconnectionAttempts++;
        if (reconnectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
            setTimeout(connectToSpeaker, 5000); // try to reconnect after 5 seconds
        } else {
            logger.error('Max reconnection attempts reached. Please check the speaker.');
        }
    });

    socketClientConnection.on('connect_timeout', () => {
        logger.error('Connection Timeout. Please check the speaker.');
    });

    socketClientConnection.on('error', (err) => {
        logger.error('Error', err);
    });

    socketClientConnection.on('disconnect', (reason) => {
        logger.info('Disconnected: ', reason);
    });

    socketClientConnection.on('reconnect', () => {
        logger.info('Reconnected to speaker');
    });

    // Reset reconnectionAttempts on successful connection
    socketClientConnection.on('connect', () => {
        logger.info('Connected to speaker');
        reconnectionAttempts = 0; // reset reconnection attempts
    });

    // Process queue as soon as a new sentence is received from the speaker
    socketClientConnection.on('sentence', (sentence, ack) => {
    sentenceQueue.push({sentence, ack, isProcessed: false});
    processSentenceQueue();
    });
}

connectToSpeaker(); // connect to speaker when listener starts

// Map of Martian words and their English translations
const word_translations = {
    "B--B-K---Z": "food",
    "BBKZ": "vomit",
    "B-K-RKK---ZZZ": "sleep",
    "BKR-KK-ZZZ": "philosophy",
    "ZZ-KK": "need",
    "KK-ZZ": "hate",
    "L-R-Z": "I",
    "Z-R-L": "you",
    "ZZKK": "rejoice",
    "B-K": "book",
    "R--Z": "language",
    "K-L--B": "dance",
    "Z-B": "music",
    "LR-K": "death",
    "B-KR-R": "life",
    "ZZ-LL": "love",
    "K-R": "hungry",
    "L--B----Z": "thirsty",
    "R--Z--L": "happy",
    "Z-Z-Z-Z": "sad"
};

const sentenceQueue = []; // store sentences
const translationCache = new Map(); // store translations
const sentenceRegex = /^([BKRZL]-*)*[BKRZL](-----([BKRZL]-*)*[BKRZL])*$/; // regex to validate sentences
const recentTranslations = []; // store recent translations

/**
 * Function to test if a sentence is valid based on the regex
 * @param {string} sentence - The Martian sentence to validate
 * @returns {boolean} - Returns true if the sentence is valid, false otherwise
 */
function isValidSentence(sentence) {
    return sentenceRegex.test(sentence);
}

let lastReceivedTime = Date.now(); // time when the last sentence was received
const MAX_DELAY = 5000; // maximum delay in milliseconds

/**
 * Function to process the sentence queue and adapt to the speaker's pace.
 * It calculates the delay based on the time between the receipt of two sentences and introduces this delay before processing the next sentence.
 * It then calls processSentence function to process each sentence in the queue.
 * If a sentence is not processed (due to the listener being distracted), it is pushed back to the end of the queue for reprocessing.
 */
async function processSentenceQueue() {
    while (sentenceQueue.length > 0) {
        let sentenceObj = sentenceQueue[0]; // get the first sentence object in the queue
        if (!sentenceObj.isProcessed) {
            await processSentence(sentenceObj, 0);
        }
        if (!sentenceObj.isProcessed) {
            // if the sentence is still not processed, push it back to the end of the queue
            sentenceQueue.push(sentenceQueue.shift());
        } else {
            // if the sentence is processed, remove it from the queue
            sentenceQueue.shift();
        }
        let now = Date.now();
        let delay = now - lastReceivedTime; // calculate delay based on the time between the receipt of two sentences
        delay = Math.min(delay, MAX_DELAY); // if the calculated delay exceeds the maximum delay, use the maximum delay instead
        lastReceivedTime = now;
        await new Promise(resolve => setTimeout(resolve, delay)); // introduce delay before processing the sentence
    }
}

/**
 * Function to process a sentence at listener's end and send acknowledgement.
 * It checks if the sentence is valid and then translates it into English.
 * It also includes a 10% chance of listener being distracted and pausing for 1 second.
 * If the sentence is invalid or the listener gets distracted, the sentence is marked as processed and removed from the queue.
 * @param {Object} sentenceObj - The object containing the Martian sentence to process, the acknowledgement function, and the processed status
 * @param {string} sentenceObj.sentence - The Martian sentence to process
 * @param {function} sentenceObj.ack - The acknowledgement function to call after processing the sentence
 * @param {boolean} sentenceObj.isProcessed - The processed status of the sentence
 * @param {number} index - The index of the sentence in the queue
 */
async function processSentence(sentenceObj, index) {
    let {sentence, ack, isProcessed} = sentenceObj;

    if (sentence === '----------') {
        return;
    }

    if (typeof sentence !== 'string' || !isValidSentence(sentence)) {
        logger.info('Invalid sentence: ' + sentence);
        sentenceQueue[index].isProcessed = true; // set isProcessed to true for invalid sentences
        return;
    }

    const words = sentence.split('-----');
    let sentenceTranslation = [];

    logger.info('Original Sentence: ' + sentence); // print the original sentence

    for (let word of words) {
        if (Math.random() < 0.1) { // 10% chance of listener being distracted
            logger.info('Listener is distracted...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return;
        }
        let translation;
        if (translationCache.has(word)) {
            translation = translationCache.get(word);
        } else if (word in word_translations) {
            translation = word_translations[word];
            translationCache.set(word, translation);
        } else {
            translation = 'UNKNOWN';
        }
        sentenceTranslation.push(translation);
    }

    logger.info('Translation: ' + sentenceTranslation.join(' '));
    recentTranslations.push(sentenceTranslation.join(' '));
    if (recentTranslations.length > 10) {
        recentTranslations.shift();
    }

    if (typeof ack === 'function') {
        ack('received');
        logger.info('Message received. Acknowledgement sent.');
    }

    sentenceQueue[index].isProcessed = true; // set isProcessed to true after sentence is fully processed
}

/**
 * Function to get recent translations
 * @returns {Array} - Returns an array of recent translations
 */
function getRecentTranslations() {
    return recentTranslations;
}