# How ?

The key is a 6-length lower-case alpha string => so the range is 'aaaaaa' - 'zzzzzz'.
There is 26^6 = 309 000 000 possibilities.
By using frequency analysis there is only 26 * 6 = 152 possibilities because we test the key byte separately.
We know if a combination is good by checking the frequency analysis of characters in the plan text based on French language.

