import minimist from 'minimist';
import cliProgress from 'cli-progress';
import { getLanguages, getUnexpectedChars, 
    getDictionary, findBestKey, xor } from './decoding';
import { readdir, readFile, writeFile, atLeast } from './utils';

const argv = minimist(process.argv.slice(2));

(async () => {
    console.time('all files decoding');

    // const bar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic);

    const languages = await getLanguages();
    const unexpectedChars = await getUnexpectedChars();
    const dictionary = await getDictionary();

    const keyLength = argv.kl || 6;
    const encryptedFiles = await readdir(argv.d || './resources/encrypted_files');
    const iterations = encryptedFiles.length * keyLength * 26;

    // bar.start(100, 0);

    await Promise.all(encryptedFiles.map(async (filename, f) => {
        const path = argv.d ? argv.d + '/' : './resources/encrypted_files/';
        const cipher = await readFile(path + filename);

        // const onAttempt = (k, c) => {
        //     const progress = ((f * k * c) / iterations) * 100;
        //     bar.update(Math.round(progress));
        // }
        
        console.time(`find best key of ${filename}`);
        const key = await findBestKey(languages, unexpectedChars, cipher, keyLength);
        console.timeEnd(`find best key of ${filename}`);

        const message = xor(cipher, key);

        let output = 'key: ' + key.map(dec => String.fromCharCode(dec)).join('') + '\n\n' + message;
        output += atLeast(dictionary, word => message.includes(word), 3) ? 
            message : "The message doesn't contain at least 3 words from dictionary. We assume the key is bad.";

        await writeFile(`./output/${filename}`, output);    
    }));

    console.timeEnd('all files decoding');
    process.exit();
})();