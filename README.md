A cryptography project realized in my IT school.

# Goal

The goal is to decrypt 11 files that have been encrypted by 

# How ?

The key is a 6-length lower-case alpha string => so the range is 'aaaaaa' - 'zzzzzz'.
There is 26^6 = 309 000 000 possibilities.
By using frequency analysis there is only 26 * 6 = 152 possibilities because we test the key byte separately.
We know if a combination is good by checking the frequency analysis of characters in the plan text based on French language.

# Frequency analysis

    // https://www.persee.fr/doc/bsnaf_0081-1181_1969_num_1967_1_11724
    // https://fr.wikipedia.org/wiki/Fr%C3%A9quence_d%27apparition_des_lettres_en_fran%C3%A7ais

# TODO
tester juste en checkant les e