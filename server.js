const express = require('express');
const Busboy = require('busboy');
const stream = require('stream');
const axios = require('axios');
require('dotenv').config();

const accessToken = process.env.ACCESS_TOKEN;
if (!accessToken) {
    console.error('ACCESS_TOKEN is required');
    process.exit(1);
}

const app = express();
const port = process.env.PORT || 8080;

const uploadToDropbox = async (fileStream, fileName) => {
    const url = `https://content.dropboxapi.com/2/files/upload`;
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        "Dropbox-API-Arg": JSON.stringify({
            path: `/${fileName}`,
            mode: 'add',
            autorename: false,
            mute: false,
        })
    };

    try {
        const response = await axios.post(url, fileStream, { headers });
        return response.data;
    } catch (error) {
        console.error('Error uploading file to Dropbox:', error);
        throw error;
    }
};

app.post('/upload', (req, res) => {
    const busboy = new Busboy({ headers: req.headers });
    let fileBuffer = Buffer.alloc(0);
    let fileName = '';

    busboy.on('file', (fieldname, file, filename) => {
        fileName = filename;
        file.on('data', (data) => {
            fileBuffer = Buffer.concat([fileBuffer, data]);
        });
    });

    busboy.on('finish', async () => {
        try {
            const fileStream = new stream.PassThrough();
            fileStream.end(fileBuffer);

            const dropboxResponse = await uploadToDropbox(fileStream, fileName);
            res.status(200).send(dropboxResponse);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    req.pipe(busboy);
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});