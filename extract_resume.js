const fs = require('fs');
const pdf = require('pdf-parse');

async function extract() {
    let dataBuffer = fs.readFileSync('../resume.pdf');
    try {
        const data = await pdf(dataBuffer);
        fs.writeFileSync('./resume.txt', data.text);
        console.log('Successfully extracted resume text to resume.txt');
    } catch (e) {
        console.error('Error parsing PDF:', e);
    }
}

extract();
