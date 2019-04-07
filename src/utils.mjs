import fs from 'fs';
import util from 'util';

export const readdir = util.promisify(fs.readdir);
export const readFile = util.promisify(fs.readFile);
export const writeFile = util.promisify(fs.writeFile);

export const atLeast = (array, predicate, n) => {
    const length = array == null ? 0 : array.length;
    let index = -1;
    let ocr = 0;
  
    while (++index < length) {
        if (predicate(array[index], index, array))
            ocr++;
    }

    return ocr >= n;
}