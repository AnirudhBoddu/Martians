# Martians

## Description

This project is a simulation of a communication system between Martians and Humans. It uses a Martian language, where each word is represented by a combination of the characters B, K, R, Z, and L. The system consists of a speaker and a listener. The speaker generates sentences in the Martian language, emits them, and logs all the sentences for future reference. The listener receives these sentences, translates them into English, acknowledges receipt, and logs all the sentences and their translations.

## Technologies Used

- Node.js
- Express.js
- Socket.IO
- Winston (for logging)

## Installation

Ensure that you have Node.js installed on your machine. The version should be 10.0.0 or higher.

To install the project, follow these steps:

1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Run `npm install` to install the dependencies.

## Usage

The project consists of two main scripts: `src/speaker.js` and `src/listener.js`.

- `src/speaker.js`: This script generates sentences in the Martian language, emits them using Socket.IO, and logs all the sentences in the `logs` folder. It also handles acknowledgements from the listener.

- `src/listener.js`: This script listens for sentences emitted by the speaker, translates them into English, sends an acknowledgement back to the speaker, and logs all the sentences and their translations in the `logs` folder.

To start the speaker, run `node src/speaker.js` in the terminal.

To start the listener, run `node src/listener.js` in another terminal.

## Logs

Both the speaker and the listener log their activities in the `logs` folder. Each log file is named with the format `MartiansConversation-<role>-<timestamp>.log`, where `<role>` is either `speaker` or `listener`. The log files contain the original Martian sentences, their translations (for the listener), and any errors or issues that occurred during the process.
