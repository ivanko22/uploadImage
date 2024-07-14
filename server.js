const express = require('express');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const accessToken = process.env.ACCESS_TOKEN;

const app = express();
const port = process.env.PORT || 8080;

const storage = new Storage();
const bucket = storage.bucket('images');

const multerStorage = multer.memoryStorage();

const upload = multer({ storage: multerStorage });

const uploadToDropbox = async (filePath) => {
    const fileName = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);

    const url = `https://content.dropboxapi.com/2/files/upload`;
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        "Dropbox-API-Arg": JSON.stringify({
            // path: `/${fileName}.${req.file.mimetype.substring(6)}`,
            path: `/${fileName}`,
            mode: 'add',
            autorename: false,
            mute: false,
        })  
    };

    try{
        const response = await axios.post(url, fileData, { headers });
        console.log('File uploaded to Dropbox:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error uploading file to Dropbox:', error);
        throw error;
    }
};

app.post('/upload', upload.single('file'), async (req, res) => {
    console.log('Received a POST request on /upload');

    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    const filePath = path.join(uploadDir, req.file.originalname);

    try {
        console.log('Request body:', req.body);

        fs.writeFileSync(filePath, req.file.buffer);
        const response = await uploadToDropbox(filePath);
        res.send(response);
    } catch (error) {
        console.error('Error during upload:', error);

        res.status(500).json({ error: error.message });
    }finally{
        fs.unlinkSync(filePath);
        }
    });

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
}); 

