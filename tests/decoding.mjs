import assert from 'assert';
import { getLanguages, getUnexpectedChars, getCipherChunkLength, 
    groupBytesByKey, getMessageWeights, adjustMessageWeights, 
    getHighestWeight, xor } from '../src/decoding';

describe('xor decryption', () => {
    describe('cipher length to process', () => {
        it("returns the good length when it's a small one", () => {
            assert.strictEqual(getCipherChunkLength(6, 300), 300);
            assert.strictEqual(getCipherChunkLength(8, 150), 150);
            assert.strictEqual(getCipherChunkLength(1, 10), 10);
        });

        it("returns the good length when it's a large one", () => {
            assert.strictEqual(getCipherChunkLength(6, 2500), 600);            
            assert.strictEqual(getCipherChunkLength(8, 4500), 800);
            assert.strictEqual(getCipherChunkLength(3, 420), 300);
        });
    });

    it('groups cipher byte by key byte', () => {
        const bytes = ['a'.charCodeAt(0), 'b'.charCodeAt(0), 'c'.charCodeAt(0), 'd'.charCodeAt(0),
            'e'.charCodeAt(0), 'f'.charCodeAt(0), 'g'.charCodeAt(0), 'h'.charCodeAt(0),
            'i'.charCodeAt(0), 'j'.charCodeAt(0), 'k'.charCodeAt(0)];
        const result = groupBytesByKey(bytes, 4);
        const decs = [bytes[0], bytes[4], bytes[8]];
        const decs2 = [bytes[1], bytes[5], bytes[9]];

        assert.strictEqual(Object.keys(result).length, 4);
        assert.strictEqual(result[0].length, 3)
        assert.strictEqual(result[3].length, 2);
        assert.deepStrictEqual(result[0], decs);
        assert.deepStrictEqual(result[1], decs2);
    });

    it('calculates the good message weight', async () => {
        const [frenchWeight, latinWeight] = getMessageWeights(await getLanguages(), 'aeea iouup;:[');

        assert.strictEqual(frenchWeight, 76.5);
        assert.strictEqual(latinWeight, 89.11);
    });

    it('calculates the good message weight with unexpected chars', async () => {
        const [frenchWeight, latinWeight] = 
            adjustMessageWeights(await getUnexpectedChars(), 'afg{]]` flk;:^', [7500, 5000]);

        assert.strictEqual(frenchWeight, 6950);
        assert.strictEqual(latinWeight, 4450);    
    });

    it('selects the key byte with the highest value', () => {
        const frequencyAnalysis = {
            97: [4500, 7200],
            98: [7411, 1580],
            99: [3555, 8469],
            100: [2245, 7456],
            101: [6550, 9990]
        };
        const byte = getHighestWeight(frequencyAnalysis);

        assert.equal(byte, 101);
        assert.strictEqual(frequencyAnalysis[byte][0], 6550);
        assert.strictEqual(frequencyAnalysis[byte][1], 9990);
    });
 
    it('decrypts a cipher', () => {
        const result = xor([98, 105, 112, 104, 101, 114], [97, 98, 99]);

        assert.strictEqual(result.length, 6);
        assert.strictEqual(result, '\u0003\u000b\u0013\t\u0007\u0011');
    });
});