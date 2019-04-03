const fs = require('fs');
const util = require('util');
const windows1252 = require('windows-1252');

const readFile = util.promisify(fs.readFile);

fs.readFile('./resources/dictionnary.txt', 'binary', (err, data) => {
    if (err) console.error(err);

    const dictionnary = windows1252.decode(data, { 'mode': 'fatal' }).split('\n');
    let possibleKeys = [];

    dictionnary.map(word => {
        if (word.match(/^[a-z]{1,6}$\b/)) {
            let binaryChar = []; 
            for (let char of word) 
                binaryChar.push(char.charCodeAt(0).toString(2)); 
            possibleKeys.push(binaryChar.join(''));
        }
    });

    // fs.readdir('./resources/encrypted_files', (err, data) => {
    //     if (err) console.error(err);

    //     data.forEach(filename => {
    //         fs.readFile(`./resources/encrypted_files/${filename}`, 'binary', (err, data) => {
    //             if (err) console.error(err);

    //             console.log(`fichier ${filename}: `, data)

    //             possibleKeys.map(key => console.log(Crypto.AES.decrypt(data, key).toString(Crypto.enc.Utf8)));
    //         })
    //     })
    // })

    fs.readFile('./resources/encrypted_files/PA.txt', 'binary', (err, data) => {
        if (err) console.error(err);

        console.log(possibleKeys)

        possibleKeys.map(key => console.log(Crypto.AES.decrypt(data, key).toString(Crypto.enc.Utf8)));  
    });

    console.log('Nombre de clés possibles: ', possibleKeys.length);
});

export const decrypt = (algorithm, cipher, key, dictionnary) => {
    const message = algorithm(cipher, key).toString(Crypto.enc.Utf8);
    if (dictionnary.includes(message)) {
        console.log('key: ', key);
        console.log('message: ', message);
        process.exit();
    }
}