const express = require('express');
require('dotenv').config();
const multer = require('multer');
const axios = require('axios');
const stream = require('stream');

const accessToken = process.env.ACCESS_TOKEN;
console.log('ACCESS_TOKEN:', accessToken);

if (!accessToken) {
    console.error('ACCESS_TOKEN is required');
    process.exit(1);
}

const app = express();
const port = process.env.PORT || 8080;

// Set up multer to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadToDropbox = async (fileStream, fileName) => {
    console.log('Uploading file to Dropbox:', fileName);

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
        console.log('File uploaded to Dropbox:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error uploading file to Dropbox:', error);
        throw error;
    }
};

app.post('/upload', upload.single('file'), async (req, res) => {
    console.log('Received file:', req.file);

    if (!req.file) {
        console.error('No file uploaded');
        return res.status(404).send('No file uploaded');
    }

    try {
        const fileName = req.file.originalname;
        const fileStream = new stream.PassThrough();
        fileStream.end(req.file.buffer);

        console.log('Uploading file to Dropbox:', fileName);

        const dropboxResponse = await uploadToDropbox(fileStream, fileName);
        res.status(200).send(dropboxResponse);
    } catch (error) {
        console.error('Error during upload process:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});