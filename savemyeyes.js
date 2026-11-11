import { serialout } from './nebulavm.js';
// this is a program to filter out the output and warn of flasing images.
const filterlimitchar = 8000;
const localizedserialout = serialout;

// character counter
let charCount = 0;


function countAllASCII(input) {
    if (typeof input !== "string") {
        throw new Error("Input must be a string.");
    }

    let asciiCount = 0;

    for (let char of input) {
        let code = char.charCodeAt(0);
        // ASCII range: 0–127
        if (code >= 0 && code <= 127) {
            asciiCount++;
        }
    }

    return asciiCount;
}

countedcharacters = countAllASCII(localizedserialout);

if (countedcharacters > filterlimitchar) {
  console.warn("a lot of characters will be outputted, this may cause flashing images.");
  console.warn("characters: " + countedcharacters);
  setTimeout(() => {
    console.warn("flashing images warning: " + countedcharacters + " characters will be outputted.");
  }, 1000);
}