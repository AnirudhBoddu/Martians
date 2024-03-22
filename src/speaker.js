/**
 * This module is responsible for establishing a connection with a client via a WebSocket and emitting Martian sentences to the client.
 * It generates Martian sentences, validates them, and handles server errors.
 * @module speaker
 */

const express = require('express');
const app = express();
const http = require('http');
const {Server} = require("socket.io");
const logger = require('../utils/logger')('speaker');

// List of words to form sentences
const WORDS = [
    "B--B-K---Z",
    "BBKZ",
    "B-K-RKK---ZZZ",
    "BKR-KK-ZZZ",
    "ZZ-KK",
    "KK-ZZ",
    "L-R-Z",
    "Z-R-L",
    "ZZKK",
    "B-K",
    "R--Z",
    "K-L--B",
    "Z-B",
    "LR-K",
    "B-KR-R",
    "ZZ-LL",
    "K-R",
    "L--B----Z",
    "R--Z--L",
    "Z-Z-Z-Z",
    "B-K--Z", // Words added with no English translation to test unknown words case in listener
    "R--Z--Z",
    "A-BZ",
    "PQRS"
];

let currentIndex = 0; // Initializing index for forming sentences

/**
 * Function to handle speaker connection.
 * It sets up event listeners for various socket events such as 'connection', 'disconnect', and 'error'.
 * @param {object} socketServer - The socket server object
 */
function handleConnection(socketServer) {
    socketServer.on('connection', (clientSocket) => {
        logger.info('*** A user connected ***');
        clientSocket.on('disconnect', () => {
            logger.info('*** A user disconnected ***');
        });
        clientSocket.on('error', (err) => {
            logger.error('Socket Error', err);
            throw err;
        });
    });
}

/**
 * Function to handle speaker errors.
 * It sets up an event listener for 'error' event.
 * @param {object} server - The server object
 */
function handleError(server) {
    server.on('error', (err) => {
        logger.error('Server Error', err);
        throw err;
    });
}

// Constants for sentence generation and server port
const SENTENCE_LENGTH = 5;
const WORD_SEPARATOR = '-----';
const SENTENCE_SEPARATOR = '----------';
const SERVER_PORT = 3000;

/**
 * Function to generate a sentence.
 * It forms a sentence by concatenating words from the WORDS array based on the current index and sentence length.
 * @returns {string} - Returns the generated sentence
 */
function generateSentence() {
    let sentence = [];
    for (let i = 0; i < SENTENCE_LENGTH; i++) {
        sentence.push(WORDS[(currentIndex + i) % WORDS.length]);
    }
    return sentence.join(WORD_SEPARATOR);
}

/**
 * Function to validate a sentence.
 * It checks if the sentence is a string.
 * @param {string} sentence - The sentence to validate
 * @returns {boolean} - Returns true if the sentence is valid, false otherwise
 */
function validateSentence(sentence) {
    if (typeof sentence !== 'string') {
        logger.info('Invalid sentence');
        return false;
    }
    return true;
}

/**
 * Function to emit a sentence.
 * It emits the sentence to the client and logs whether an acknowledgement is received.
 * @param {object} socketServer - The socket server object
 * @param {string} sentence - The sentence to emit
 */
function emitSentence(socketServer, sentence) {
    logger.info(`Emitting sentence: ${sentence}`);
    socketServer.emit('sentence', sentence, (ack) => {
        if (sentence !== SENTENCE_SEPARATOR) {
            if (ack) {
                logger.info('Acknowledgement received by speaker.');
            } else {
                logger.info('Acknowledgement not received by speaker.');
            }
        }
    });
}

/**
 * Function to emit sentences.
 * It emits sentences at random intervals between 0 and 500ms to simulate slow and fast speakers.
 * It includes a 10% chance of speaker choking and not emitting a sentence.
 * @param {object} socketServer - The socket server object
 */
function emitSentences(socketServer) {
    setInterval(() => {
        if (Math.random() < 0.1) { // 10% chance of speaker choking
            logger.info('Speaker is choking...')
            return;
        }
        let sentence = generateSentence();
        if (validateSentence(sentence)) {
            emitSentence(socketServer, sentence);
            emitSentence(socketServer, SENTENCE_SEPARATOR);
            currentIndex = (currentIndex + SENTENCE_LENGTH) % WORDS.length;
        }
    }, Math.random() * 500); // Random interval between 0 and 500ms to simulate slow and fast speakers
}

/**
 * Function to start the server.
 * It creates a server, starts listening on the specified port, and sets up connection handling and error handling.
 * It also starts emitting sentences.
 */
function startSpeaker() {
    const server = http.createServer(app);
    const socketServer = new Server(server);
    server.listen(SERVER_PORT, () => {
        logger.info(`Listening on *:${SERVER_PORT}`);
    });
    handleConnection(socketServer);
    handleError(server);
    emitSentences(socketServer);
}

// Start the speaker
startSpeaker();