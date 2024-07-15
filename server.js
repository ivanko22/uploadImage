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
    console.log('uploadToDropbox file to Dropbox:', filePath);

    const fileName = path.basename(`${filePath}.jpg`);
    const fileData = fs.readFileSync(filePath);

    // try {
    //     fileData = fs.readFileSync(filePath);
    // } catch (readError) {
    //     console.error(`Error reading file at ${filePath}:`, readError); 
    //     throw readError;
    // }

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
        // Save the file to the temp directory
        fs.writeFileSync(tempFilePath, req.file.buffer);

        console.log('tempFilePath', tempFilePath);

        const dropboxResponse = await uploadToDropbox(tempFilePath);
        res.status(200).send(dropboxResponse);
    } catch (error) {
        console.error('Error during upload process:', error);
        res.status(500).json({ error: 'Internal server erro' });
    }finally{
        if(fs.existsSync(tempFilePath)){
            try{
            fs.unlinkSync(tempFilePath)
        }catch(unlinkError){
            console.error('Error deleting file:', unlinkError);
        }
    }
    }
    });

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
}); 
