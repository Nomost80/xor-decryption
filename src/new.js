const fs = require('fs');
const util = require('util');
const windows1252 = require('windows-1252');
const _ = require('lodash');
const cliProgress = require('cli-progress');

const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);

const bar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic);

(async () => {
    const data = await readFile('./resources/dictionnary.txt', 'binary');
    const dictionary = windows1252.decode(data, { 'mode': 'fatal' }).split('\n');

    // We exclude words less than 5 chars because they aren't reliable
    const words = dictionary.filter(word => word.length > 4);

    const encryptedFiles = await readdir('./resources/encrypted_files');
    const cipher = await readFile(`./resources/encrypted_files/${encryptedFiles[5]}`);
    
    // the key is a 6-length lower-case alpha string => so the range is 'aaaaaa' - 'zzzzzz'
    // There is 26^6 = 309 000 000 possibilities

    // By using frequency analysis there is only 26 * 6 = 152 possibilities because we test the key byte separately
    // We know if a combination is good by checking the frequency analysis of characters in the plan text based on French language
    
    bar.start(100, 0);
    
    const keyLength = 6;

    // https://fr.wikipedia.org/wiki/Fr%C3%A9quence_d%27apparition_des_lettres_en_fran%C3%A7ais
    const charsFrequency = {
        'a': 7.11,
        'b': 1.14,
        'c': 3.18,
        'd': 3.67,
        'e': 12.10,
        'f': 1.11,
        'g': 1.23,
        'h': 1.11,
        'i': 6.59,
        'j': 0.34,
        'k': 0.29,
        'l': 4.96,
        'm': 2.62,
        'n': 6.39,
        'o': 5.02,
        'p': 2.49,
        'q': 0.65,
        'r': 6.07,
        's': 6.51,
        't': 5.92,
        'u': 4.49,
        'v': 1.11,
        'w': 0.17,
        'x': 0.38,
        'y': 0.46,
        'z': 0.15
    };

    let charByKeyChar = {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: []
    };
    
    // group cipher bytes by key bytes
    for (let i = 0; i < cipher.byteLength / 2; i++)
        charByKeyChar[i % keyLength].push(cipher[i]);

    // array of dec values    
    let key = [];

    // for each key char 
    for (let k = 0; k < keyLength; k++) {
        let frequencyAnalysis = {};

        // for each possible characters (a-z)
        for (let c = 'a'.charCodeAt(0); c < 'z'.charCodeAt(0) + 1; c++) {
            const kcMessage = charByKeyChar[k].reduce((acc, encryptedByte) => 
                acc += String.fromCharCode(c ^ encryptedByte), '');

            const kcWeight = Object.keys(charsFrequency).reduce((acc, char) => {
                const regex = new RegExp(char, 'g');
                const occurences = (kcMessage.match(regex) || []).length;
                return acc += occurences * charsFrequency[char];
            }, 0);

            frequencyAnalysis[c] = kcWeight;

            const progress = ((k * c) / (26 * 6)) * 100
            bar.update(progress);
        }

        const kWithBestWeight = Object.keys(frequencyAnalysis).reduce((a, b) => 
            frequencyAnalysis[a] > frequencyAnalysis[b] ? a : b);
        key.push(kWithBestWeight);
    }

    let message = '';

    for (let i = 0; i < cipher.byteLength; i++) {
        const cBloc = cipher[i];
        const kBloc = key[i % key.length];
        const xor = cBloc ^ kBloc;
        message += String.fromCharCode(xor);
    }    

    const matched = atLeast(words, word => { 
        if (message.includes(word)) {
            console.log('word: ', word);
            return true;
        }
        else return false;
    }, 3); 

    if (matched) {
        console.log('key: ', key);
        console.log('message: ', message);
        process.exit();    
    }
})();

const atLeast = (array, predicate, n) => {
    const length = array == null ? 0 : array.length;
    let index = -1;
    let ocr = 0;
  
    while (++index < length) {
        if (predicate(array[index], index, array))
            ocr++;
    }

    return ocr >= n;
}