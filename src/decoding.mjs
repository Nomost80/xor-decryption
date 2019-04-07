import os from 'os';
import Pool from 'worker-threads-pool';
import windows1252 from 'windows-1252';
import _ from 'lodash';
import { readdir, readFile } from './utils';

const pool = new Pool({ max: os.cpus().length });

export const getLanguages = async () => {
    const filenames = await readdir('./lang');
    return await Promise.all(filenames.map(async f =>
        JSON.parse(await readFile(`./lang/${f}`, 'utf8'))
    ));
}

export const getUnexpectedChars = async () => 
    JSON.parse(await readFile('./resources/unexpected_chars.json', 'utf8'))

export const getDictionary = async () => {
    const data = await readFile('./resources/french_dictionnary.txt', 'binary');
    const dictionary = windows1252.decode(data, { 'mode': 'fatal' }).split('\n');
    // We exclude words less than 5 chars because they aren't reliable
    return dictionary.filter(word => word.length > 4);
}

// don't analyse the whole text in order to gain time, 
// we consider that 100 cipher bytes for a key byte is enough
const getCipherChunkLength = (kLength, cLength, minBytes = 100) => 
    cLength / kLength < minBytes ? cLength : kLength * minBytes;

// e.g. if key = CLE and cipher = MESAGE => M and A were xor with C 
const groupBytesByKey = (cipher, keyLength) => {
    let groups = {};

    for (let i = 0; i < getCipherChunkLength(keyLength, cipher.byteLength); i++) {
        const key = groups[i % keyLength];
        groups[i % keyLength] = key ? [...key, cipher[i]] : [cipher[i]];
    }

    return groups;    
}

// calculate the message weight by analysing the chars frequency for each language
export const getMessageWeights = (languages, message) => {
    return languages.map(lang => {
        return Object.keys(lang).reduce((acc, char) => {
            const regex = new RegExp(char, 'g');
            const occurences = (message.match(regex) || []).length;
            return acc += occurences * lang[char];
        }, 0);
    });
}

// Adjust the weight by decreasing it according unexpected chars
export const adjustMessageWeights = (unexpectedChars, message, weights) => {
    return weights.map(weight => {
        return Object.keys(unexpectedChars).reduce((acc, char) => {
            const regex = new RegExp('\\' + char, 'g');
            const occurences = (message.match(regex) || []).length;
            return acc += occurences * unexpectedChars[char];
        }, weight);
    });
}

// get the key byte value for the highest message weight of the frequency analysis
export const getHighestWeight = frequencyAnalysis => {
    return Object.keys(frequencyAnalysis).reduce((a, b) => 
        _.max(frequencyAnalysis[a]) > _.max(frequencyAnalysis[b]) ? a : b);
}

// worker (thread) pool which find the best value of a key part (one byte)
const runKeyWorker = workerData => {
    return new Promise((resolve, reject) => {
        pool.acquire('./src/worker.mjs', { workerData }, (err, worker) => {
            if (err) return reject(err);
            worker.on('message', resolve);
            worker.on('error', reject);
        })
    });
}

// find the most likely key for a given cipher according frequency analysis
// it returns an array of int
export const findBestKey = async (languages, unexpectedChars, cipher, keyLength) => {
    const bytes = groupBytesByKey(cipher, keyLength);

    return await Promise.all(_.range(keyLength).map(async k =>
        await runKeyWorker({ languages, unexpectedChars, bytes, k })
    ));
}

// str: array of int, key: array of int
export const xor = (str, key) => {
    let result = '';
    
    for (let i = 0; i < str.length; i++) {
        const sBloc = str[i];
        const kBloc = key[i % key.length];
        const xor = sBloc ^ kBloc;
        result += String.fromCharCode(xor);
    }
    
    return result;
}