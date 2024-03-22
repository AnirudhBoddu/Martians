const { io } = require("socket.io-client");
let socketClientConnection;

const SPEAKER_URL = "ws://localhost:3000";

// Function to establish connection with the speaker
function connectToSpeaker() {
    socketClientConnection = io(SPEAKER_URL, {
        reconnection: false // disable automatic reconnection
    });

    socketClientConnection.on('connect_error', (err) => {
        console.log('Connection Error', err);
        setTimeout(connectToSpeaker, 5000); // try to reconnect after 5 seconds
    });

    socketClientConnection.on('connect_timeout', () => {
        console.log('Connection Timeout');
    });

    socketClientConnection.on('error', (err) => {
        console.log('Error', err);
        throw err;
    });

    socketClientConnection.on('disconnect', (reason) => {
        console.log('Disconnected: ', reason);
    });

    socketClientConnection.on('reconnect', () => {
        console.log('Reconnected to speaker');
    });

    socketClientConnection.on('sentence', (sentence, ack) => {
        try {
            processSentence(sentence, ack);
        } catch (error) {
            console.log('Error processing sentence - ', error.message);
        }
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

// Function to test if a sentence is valid based on the regex
function isValidSentence(sentence) {
    return sentenceRegex.test(sentence);
}

let lastReceivedTime = Date.now(); // time when the last sentence was received
const MAX_DELAY = 5000; // maximum delay in milliseconds

// Function to process the sentence queue
async function processSentenceQueue() {
    while (sentenceQueue.length > 0) {
        let {sentence, ack} = sentenceQueue.shift();
        let now = Date.now();
        let delay = now - lastReceivedTime; // calculate delay based on the time between the receipt of two sentences
        delay = Math.min(delay, MAX_DELAY); // if the calculated delay exceeds the maximum delay, use the maximum delay instead
        lastReceivedTime = now;
        await new Promise(resolve => setTimeout(resolve, delay)); // introduce delay before processing the sentence
        await processSentence(sentence, ack);
    }
}

// Function to process a sentence at listener's end and send acknowledgement
// Also includes a 10% chance of listener being distracted and pausing for 1 second
async function processSentence(sentence, ack) {
    if (sentence === '----------') {
        return;
    }

    if (!isValidSentence(sentence)) {
        console.log('Invalid sentence: ' + sentence);
        return;
    }

    const words = sentence.split('-----');
    let sentenceTranslation = [];

    for (let word of words) {
        if (Math.random() < 0.1) { // 10% chance of listener being distracted
            console.log('Listener is distracted...');
            await new Promise(resolve => setTimeout(resolve, 1000));
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

    console.log('Translation: ' + sentenceTranslation.join(' '));
    recentTranslations.push(sentenceTranslation.join(' '));
    if (recentTranslations.length > 10) {
        recentTranslations.shift();
    }

    if (typeof ack === 'function') {
        console.log('Sending acknowledgement...');
        ack('received');
        console.log('Message received. Acknowledgement sent.');
    }
}

// Function to get recent translations
function getRecentTranslations() {
    return recentTranslations;
}

// Process queue as soon as a new sentence is received
socketClientConnection.on('sentence', (sentence, ack) => {
    sentenceQueue.push({sentence, ack});
    processSentenceQueue();
});

