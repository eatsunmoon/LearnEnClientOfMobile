const { ipcMain, Notification, app ,dialog} = require('electron');
const express = require('express');
const path = require('path');
const { networkInterfaces } = require('os');


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
    ipcMain.on('open-directory-dialog', (event) => {
        dialog.showOpenDialog(win, {
            properties: ['openDirectory']
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
                server = s.listen(port, () => {
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