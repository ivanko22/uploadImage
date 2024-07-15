const express = require('express');
require('dotenv').config();
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const accessToken = process.env.ACCESS_TOKEN;

console.log('ACCESS_TOKEN:', accessToken);

if(!accessToken){
    console.error('ACCESS_TOKEN is required');
    process.exit(1);
}

const app = express();
const port = process.env.PORT || 8080;

const multerStorage = multer.memoryStorage();

const upload = multer({ storage: multerStorage });

const uploadToDropbox = async (filePath) => {
    console.log('Uploading file to Dropbox:', filePath);

    const fileName = path.basename(`${filePath}.jpg`);
    const fileData = fs.readFileSync(filePath);

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
    const tempDir = path.join(__dirname, 'temp');
    const tempFilePath = path.join(tempDir, req.file.originalname);

    console.log('Received file:', req.file);
    console.log('File saved to:', tempDir, tempFilePath);

    try {
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        
        fs.writeFileSync(tempFilePath, req.file.buffer);

        const response = await uploadToDropbox(tempFilePath);
        res.send(response);
    } catch (error) {
        console.error('Error during upload:', error);
        res.status(500).json({ error: error.message });
    }finally{
        if(fs.existsSync(tempFilePath)){
            fs.unlinkSync(tempFilePath)
        }
    }
    });

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
}); 
