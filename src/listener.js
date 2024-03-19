const { io } = require("socket.io-client");
const socketClient = io("ws://localhost:3000");

// Map of Martian sentences and their English translations
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

// Create a queue to store incoming sentences
const sentenceQueue = [];

// Create a cache to store translations for improved performance
const translationCache = new Map();

// Function to process the sentence queue
function processSentenceQueue() {
    if (sentenceQueue.length > 0) {
        let {sentence, ack} = sentenceQueue.shift();
        // Validate the sentence
        if (typeof sentence !== 'string') {
            console.log('Invalid sentence');
            throw new Error('Invalid sentence');
        }
        // Check if the sentence is a string of 10 hyphens
        if (sentence === '----------') {
            return;
        }

        // Split the sentence into words
        const words = sentence.split('-----');

        // Translate each word and store the translations in cache for improved performance
        const translations = words.map(word => {
            if (translationCache.has(word)) {
                // If the word's translation is in the cache, return it
                return translationCache.get(word);
            } else if (word in word_translations) {
                // If the word matches a known Martian word, cache and return its English translation
                const translation = word_translations[word];
                translationCache.set(word, translation);
                return translation;
            } else {
                // If the word is not recognized, return 'UNKNOWN'
                return 'UNKNOWN';
            }
        });

        // Join the translations into a single string and print it
        console.log('Translation: '+ translations.join(' '));

        // Acknowledge the sentence
        if (typeof ack === 'function') {
            console.log('Sending acknowledgement...');
            ack('received');
            console.log('Message received. Acknowledgement sent.');
        }
    }
}

// Event listeners for the socket client
socketClient.on('connect_error', (err) => {
    console.log('Connection Error', err);
});

socketClient.on('connect_timeout', () => {
    console.log('Connection Timeout');
});

socketClient.on('error', (err) => {
    console.log('Error', err);
});

// Listen for sentences from the server and translate them
socketClient.on('sentence', (sentence, ack) => {
    try {
        // Add the sentence to the queue
        sentenceQueue.push({sentence, ack});

        // Process the sentence queue
        processSentenceQueue();
    } catch (error) {
        console.log('Error processing sentence', error);
    }
});

// Set an interval to process the sentence queue
setInterval(processSentenceQueue, 1000);