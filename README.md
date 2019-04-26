# Goal
The goal is to decrypt 11 files. 

What we know?
* The password contains 6 characters in lowercase from a-z.
* Files have been encrypted with a XOR
* There is a file which contains latin

In theory, there are 26^6 possibilities (308 915 776) but with what we know there are only 6 * 26 possibilities (152). 

# How?
I used brut force and frequency analysis.

1. I group ciphered bytes by key byte (e.g. key: `ABC` and cipher: `ABCDEF` = A:(A,D); B:(B, E); F:(C, F)
2. For each key byte (6) and for each possibility (a-z):
    * Decrypt grouped bytes with the possibility
    * Frequency analysis of the message for each possible language
        * Count the number of each letter in the message which we multiply by its weight (probability)
        * Count the number of each unexpected char in the message which we multiply by its negative weight
    * Pick the key byte possibility which produced the highest weight (more probable message)
3. Decryption of the cipher with the key previously found.
4. We check if the message contains at least 3 words of a dictionary
    * If yes, we write the message in a new file
    * If not, we assume the key found is wrong
   
# Frequency analysis
* [French frequency](https://fr.wikipedia.org/wiki/Fr%C3%A9quence_d%27apparition_des_lettres_en_fran%C3%A7ais)
* [Latin frequency](https://www.persee.fr/doc/bsnaf_0081-1181_1969_num_1967_1_11724)

# How to run it?
```bash
npm install && npm run start
```
