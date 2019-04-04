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
    // We exclude words less than 5 chars because they aren't reliable
    const words = dictionary.filter(word => word.length > 4);

    const encryptedFiles = await readdir('./resources/encrypted_files');
    const cipher = await readFile(`./resources/encrypted_files/${encryptedFiles[0]}`);
    
    // the key is a 6-length max lower-case alpha string => so the range is 'a' - 'zzzzzz'
    // There is 26^1 + 26^2 + 26^3 + 26^4 + 26^5 + 26^6 = 321 272 406 possibilities
    
    bar.start(100, 0);
    
    let key = 'a'; // a = 97; z = 122 
    let i = 0;
    const max = 321272406;
    
    while (key != 'zzzzzz') {
        console.log('key tested: ', key)
        const decKey = key.toDecimalArray();
        let message = '';
        
        // It's useless to decrypt the whole text. Somes words are enough.
        // Therefore the key will be shorter, so it will be faster to compute
        for (let j = 0; j < cipher.byteLength / 2; j++) {
            const cBloc = cipher[j];
            const kBloc = decKey[j % decKey.length];
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

const nextChar = c => c === 'z' ? 'a' : String.fromCharCode(c.charCodeAt(0) + 1);

const atLeast = (array, predicate, n) => {
    let index = -1;
    const length = array == null ? 0 : array.length;
    let ocr = 0;
  
    while (++index < length) {
      if (predicate(array[index], index, array))
        ocr++;
    }

    return ocr >= n;
}