import { workerData, parentPort } from 'worker_threads';
import { getMessageWeights, adjustMessageWeights, getHighestWeight } from './decoding';

const { languages, unexpectedChars, bytes, k } = workerData;

let frequencyAnalysis = {};

const start = 'a'.charCodeAt(0);
const end = 'z'.charCodeAt(0) + 1;

// for each possible characters (a-z)
for (let c = start; c < end; c++) {
    const message = bytes[k].reduce((acc, encryptedByte) => 
        acc += String.fromCharCode(c ^ encryptedByte), '');
    
    const weights = getMessageWeights(languages, message); 
    const adjustedWeights = adjustMessageWeights(unexpectedChars, message, weights); 
    
    frequencyAnalysis[c] = adjustedWeights;
    
    // onAttempt(k + 1, c - start);
}

const highestWeight = getHighestWeight(frequencyAnalysis);

parentPort.postMessage(highestWeight);

process.exit();