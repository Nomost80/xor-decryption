const fs = require('fs');
const util = require('util');
const windows1252 = require('windows-1252');
const _ = require('lodash');
const cliProgress = require('cli-progress');

const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);

const bar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic);

(async () => {
    String.prototype.toDecimalArray = function() {
        let result = [];
        for (let char of this)
            result.push(char.charCodeAt(0));
        return result;    
    }

    const data = await readFile('./resources/dictionnary.txt', 'binary');
    const dictionary = windows1252.decode(data, { 'mode': 'fatal' }).split('\n');

    const encryptedFiles = await readdir('./resources/encrypted_files');
    const cipher = await readFile(`./resources/encrypted_files/${encryptedFiles[0]}`);
    // It's useless to decrypt the whole text. Somes words are enough.
    // Therefore the key will be shorter, so it will be faster to compute

    // the key is a 6-length max lower-case alpha string => so the range is 'a' - 'zzzzzz'
    // There is 26^1 + 26^2 + 26^3 + 26^4 + 26^5 + 26^6 = 321 272 406 possibilities

    bar.start(100, 0);

    let key = 'a'; // a = 97; z = 122 
    let i = 0;
    const max = 321272406;

    while (key != 'zzzzzz') {
        const decKey = key.toDecimalArray();
        let message = '';

        for (let j = 0; j < cipher.byteLength; j++) {
            const cBloc = cipher[j];
            const kBloc = decKey[j % decKey.length];
            const xor = cBloc ^ kBloc;
            message += String.fromCharCode(xor);
        }

        // const binaryKey = stringToBinaryString(key);
        // const expandedKey = expandKey(binaryKey, cipher.byteLength * 8);
        // const xor = parseInt(expandKey, 2) ^ 0;
        // const plainBytes = Array.from(xor.toString(2));
        // const message = 
        //     _.chunk(plainBytes, 8)
        //     .reduce((message, byte) => message += String.fromCharCode(parseInt(byte.join(''), 2)), '');

        if (dictionary.some(word => message.includes(word))) {
            console.log('key: ', key);
            console.log('message: ', message);
            process.exit();    
        }
        else key = nextKey(key);

        i++;
        bar.update(i / max * 100);
    }
})();

const nextKey = key => {
    const lastChar = key.slice(-1);
    if (lastChar === 'z') return key + nextChar(lastChar);
    else return key.slice(0, -1) + nextChar(lastChar);
}

const nextChar = c => c === 'z' ? 'a' : c.charCodeAt(0) + 1;

const stringToBinaryString = s => {
    let buffer = [];
    for (let c of s)
        buffer.push(c.charCodeAt(0).toString(2));
    return Array.from(buffer).join('');
};

// Expand a key to a given size by filling with its previous first bits
// e.g. expandKey('10001010', 12) => 1000 1010 1000 / expandKey('11100110', 18) => 1110 0110 1110 0110 11
const expandKey = (key, newLength) => {
    let newKey = key;

    for (let c of key) {
        newKey += c;
        if (newKey.length === newLength) return newKey;
    }

    if (newKey.length < newLength)
        expandKey(newKey, newLength);
}