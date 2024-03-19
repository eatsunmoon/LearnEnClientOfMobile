const { ipcMain, Notification, app, dialog } = require('electron');
const express = require('express');
const path = require('path');
const { networkInterfaces } = require('os');
const fs = require('fs');
const qr = require('qrcode');




function getLocalIpAddress() {
    const interfaces = networkInterfaces();
    for (const interfaceName in interfaces) {
        const iface = interfaces[interfaceName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return null;
}

function listenChooseServDir(win) {
    ipcMain.on('open-directory-dialog', (event, dir) => {
        dialog.showOpenDialog(win, {
            properties: ['openDirectory'],
            defaultPath: dir,
            title: "Choose the diretory to serve"
        }).then((result) => {
            if (!result.canceled && result.filePaths.length > 0) {
                const selectedDirectory = result.filePaths[0];
                event.sender.send('selected-directory', selectedDirectory);
            }
        });
    });
}

let server;
let servingDirectory;

module.exports = {
    initServer: (win) => {
        listenChooseServDir(win)
        ipcMain.on('start-server', (event, { directory, port }) => {
            if (!server) {
                const s = express();
                s.use(express.static(path.resolve(directory)));
                setExpress(s)
                server = s.listen(port, () => {
                    server.setTimeout(0)
                    const ipAddress = getLocalIpAddress();
                    let msg = `Server running at http://${ipAddress}:${port}/`
                    if (!ipAddress) {
                        msg = `ailed to determine local IP address. Server running at http://localhost:${port}/`
                    }
                    new Notification({
                        title: 'Server Status',
                        body: msg
                    }).show();
                });
                servingDirectory = directory;
            } else {
                new Notification({
                    title: 'Server Status',
                    body: `Server is already running.`
                }).show();
            }
        });

        ipcMain.on('stop-server', () => {
            if (server) {
                server.close(() => {
                    new Notification({
                        title: 'Server Status',
                        body: `Server stopped.`
                    }).show();
                    server = null;
                    servingDirectory = null;
                });
            } else {
                new Notification({
                    title: 'Server Status',
                    body: `Server is not running.`
                }).show();
            }
        });
    }
}

async function generateHTMLList(dirPath) {
    const files = fs.readdirSync(dirPath);

    let ul = '<ul>';
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        ul += `<li><a href="/${path.relative(servingDirectory, filePath)}">${file}</a></li>`;
    }
    const up=fs.readFileSync("upload.html")
    return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>File Upload</title>
            </head>
            <body>
                ${up}
                <br/>
                ${ul}
            </body>
            </html>`
}

function getCurrentDateTimeString() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    return year + month + day + hours + minutes + seconds;
}

function setExpress(app) {

    app.get('*', async (req, res) => {
        let subDir = req.path || ''
        const reqPath = path.join(servingDirectory, decodeURIComponent(subDir));
        if (!fs.existsSync(reqPath)) {
            res.status(500).send('The resource does not exist');
            return
        }
        const stat = fs.statSync(reqPath);
        if (stat.isDirectory) {
            const html = await generateHTMLList(reqPath)
            res.send(html)
        } else {
            res.download(reqPath);
        }
    });

    const multer = require('multer');
    // Define a custom destination function for multer
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            // Extract the directory from the query parameter 'dir'
            let subDir = req.path || ''
            let uploadDir = path.join(servingDirectory, decodeURIComponent(subDir));
            uploadDir = path.dirname(uploadDir)
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const originalname = Buffer.from(file.originalname, "latin1").toString(
                "utf8"
              );
            cb(null, originalname);
        }
    });

    const upload = multer({ storage: storage });

    app.post('/upload', upload.array('files'), (req, res) => {
        if (!req.files || req.files.length === 0) {
            return res.status(400).send('No files uploaded.');
        }
        const html=`<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>File Upload</title>
        </head>
        <body style="text-align:center">
        ${req.files.length} file(s) uploaded successfully!
        </body>
        </html>
        `
        res.send(html);

    });
}