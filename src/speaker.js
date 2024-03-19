const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const ioServer = new Server(server);

// Waiting time between sentence emissions
const INTERVAL_MS = 500;

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
    "food",
    "vomit",
    "sleep",
];

ioServer.on('connection', (clientSocket) => {
    console.log('A user connected');
    clientSocket.on('disconnect', () => { console.log('A user disconnected'); });
    clientSocket.on('error', (err) => { console.log('Socket Error', err); });
});

server.on ('error', (err) => { console.log('Server Error', err); });
server.listen(3000, () => { console.log('Listening on *:3000'); });

let currentIndex = 0;

setInterval(() => {
    try {
        // Create a sentence of 5 words
        let sentence = [];
        for (let i = 0; i < 5; i++) {
            sentence.push(WORDS[(currentIndex + i) % WORDS.length]);
        }
        sentence = sentence.join('-----');

        if (typeof sentence !== 'string') {
            console.log('Invalid sentence');
            throw new Error('Invalid sentence');
        }

        // Emit the sentence to the client and wait for an acknowledgment
        console.log(`Emitting sentence: ${sentence}`);
        ioServer.emit('sentence', sentence, (ack) => {
            if (ack) {
                console.log('Acknowledgement received by speaker.');
            } else {
                console.log('Acknowledgement not received by speaker.');
            }
        });

        // Emit 10 hyphens to separate sentences
        console.log('----------');
        ioServer.emit('sentence', '----------');

        // Increment the current index after every sentence emission
        currentIndex = (currentIndex + 5) % WORDS.length;
    } catch (error) {
        console.log('Error emitting sentence', error);
    }
}, INTERVAL_MS);