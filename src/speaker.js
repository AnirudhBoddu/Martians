// Importing required modules
const express = require('express');
const app = express();
const http = require('http');
const { Server } = require("socket.io");
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
    "B-K--Z",
    "R--Z--Z",
    "A-BZ",
    "PQRS"
];

let currentIndex = 0; // Initializing index for forming sentences

// Function to handle client connection
function handleConnection(socketServer) {
    socketServer.on('connection', (clientSocket) => {
        logger.info('*** A user connected ***');
        clientSocket.on('disconnect', () => { logger.info('*** A user disconnected ***'); });
        clientSocket.on('error', (err) => {
            logger.error('Socket Error', err);
            throw err;
        });
    });
}

// Function to handle server errors
function handleError(server) {
    server.on ('error', (err) => {
        logger.error('Server Error', err);
        throw err;
    });
}

// Constants for sentence generation and server port
const SENTENCE_LENGTH = 5;
const WORD_SEPARATOR = '-----';
const SENTENCE_SEPARATOR = '----------';
const SERVER_PORT = 3000;

// Function to generate a sentence
function generateSentence() {
    let sentence = [];
    for (let i = 0; i < SENTENCE_LENGTH; i++) {
        sentence.push(WORDS[(currentIndex + i) % WORDS.length]);
    }
    return sentence.join(WORD_SEPARATOR);
}

// Function to validate a sentence
function validateSentence(sentence) {
    if (typeof sentence !== 'string') {
        logger.info('Invalid sentence');
        return false;
    }
    return true;
}

// Function to emit a sentence
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

// Function to emit sentences
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

// Function to start the server
function startSpeaker() {
    const server = http.createServer(app);
    const socketServer = new Server(server);
    server.listen(SERVER_PORT, () => { logger.info(`Listening on *:${SERVER_PORT}`); });
    handleConnection(socketServer);
    handleError(server);
    emitSentences(socketServer);
}

// Start the speaker
startSpeaker();