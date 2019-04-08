import windows1252 from 'windows-1252';
import _ from 'lodash';
import { readdir, readFile } from './utils';

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
export const getCipherChunkLength = (kLength, cLength, minBytes = 100) => 
    cLength / kLength < minBytes ? cLength : kLength * minBytes;

// e.g. if key = CLE and cipher = MESAGE => M and A were xor with C 
export const groupBytesByKey = (cipher, keyLength) => {
    let groups = {};

    for (let i = 0; i < getCipherChunkLength(keyLength, cipher.length); i++) {
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

// find the most likely key for a given cipher according frequency analysis
export const findBestKey = (languages, unexpectedChars, cipher, keyLength) => {
    const bytes = groupBytesByKey(cipher, keyLength);
    
    // array of dec values
    let key = [];
    
    // for each key char 
    for (let k = 0; k < keyLength; k++) {
        let frequencyAnalysis = {};
        const start = 'a'.charCodeAt(0);
        const end = 'z'.charCodeAt(0) + 1;
        
        // for each possible characters (a-z)
        for (let c = start; c < end; c++) {
            
            const kcMessage = bytes[k].reduce((acc, encryptedByte) => 
                acc += String.fromCharCode(c ^ encryptedByte), '');
            
            const weights = getMessageWeights(languages, kcMessage); 
            const adjustedWeights = adjustMessageWeights(unexpectedChars, kcMessage, weights); 
            
            frequencyAnalysis[c] = adjustedWeights;            
        }
        
        key.push(getHighestWeight(frequencyAnalysis));
    }
    
    return key;
}

// str: array of int, key: array of int | xor decoding
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