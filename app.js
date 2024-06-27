const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const app = express();
const port = 3000;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Render the upload form
app.get('/', (req, res) => {
    res.render('index', { hash: null, qrCodeDataUrl: null });
});

// Endpoint to upload and hash a file
app.post('/upload', upload.single('document'), (req, res) => {
    const filePath = path.join(__dirname, req.file.path);

    // Create a hash of the file
    const hash = crypto.createHash('sha256');
    const fileStream = fs.createReadStream(filePath);

    fileStream.on('data', (data) => {
        hash.update(data);
    });

    fileStream.on('end', async () => {
        const fileHash = hash.digest('hex');

        // Delete the file after hashing
        fs.unlinkSync(filePath);

        try {
            // Generate QR code data URL from the hash
            const qrCodeDataUrl = await QRCode.toDataURL(fileHash);
            res.render('index', { hash: fileHash, qrCodeDataUrl });
        } catch (err) {
            res.status(500).json({ error: 'Failed to generate QR code' });
        }
    });

    fileStream.on('error', (err) => {
        res.status(500).json({ error: 'Failed to process the file' });
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
