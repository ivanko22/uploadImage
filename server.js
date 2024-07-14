const express = require('express');
require('dotenv').config();
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const accessToken = process.env.ACCESS_TOKEN;

const app = express();
const port = process.env.PORT || 8000;

// Configure multer to retain the original file extension
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // console.log('req', req);
        console.log('file', file);
        // path: `/${fileName}.${req.file.mimetype.substring(6)}`,

        // const ext = path.extname(file.originalname);
        const ext = file.mimetype.substring(6);
        const name = path.basename(file.originalname, ext);
        // const newFileName = `${name}-${Date.now()}${ext}`;
        const newFileName = `${name}-${Date.now()}.${ext}`;


        // console.log('newFileName', newFileName, ext);    
        console.log('EXT!!!!!', ext);    


        cb(null, newFileName);
    }
});

const upload = multer({ storage: storage });

const uploadToDropbox = async (filePath) => {
    const fileName = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);

    // console.log('Uploading Filename:', fileName);

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
    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    // console.log('filePath', filePath, req.file.originalname, req.file.mimetype); // Log the original file name

    try {
        const response = await uploadToDropbox(filePath);
        res.send(response);
    } catch (error) {
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

