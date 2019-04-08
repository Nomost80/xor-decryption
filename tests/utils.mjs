import assert from 'assert';
import { atLeast } from '../src/utils';

describe('utils', () => {
    it('checks if at least n elements of an array verifies a condition', () => {
        const array = [1, 7, 9, 3, 15, 22];
        assert.strictEqual(atLeast(array, n => n > 7, 3), true);
        assert.strictEqual(atLeast(array, n => n === 1, 1), true);
        assert.strictEqual(atLeast(array, n => n < 5, 5), false);
    });
});