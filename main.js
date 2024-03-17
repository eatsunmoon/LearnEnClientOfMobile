const { app, BrowserWindow, ipcMain, globalShortcut, Menu, MenuItem } = require('electron');
const { createModal } = require('./modal.js')
const { initServer } = require('./server.js')
const { registerBossShortcuts,registerGlobalShortcus } = require('./shortcuts.js')
const createSingleInstance = require('./singleInstance.js');

const createWindow = (
) => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false,
            sandbox: false
        }
    });

    win.loadFile('start.html');
    win.on('close', () => {
        app.exit()
    })

    ipcMain.on('load-url', (event, url) => {
        win.loadURL(url);
    });
    return win
};



let mainWindow;
app.whenReady().then(() => {
    mainWindow = createWindow();
    registerBossShortcuts(mainWindow)
    registerGlobalShortcus(mainWindow)
    // Get the current application menu
    const currentMenu = Menu.getApplicationMenu();
    if (currentMenu) {
        const helpMenuIndex = currentMenu.items.findIndex((item) => item.label === 'Help');
        if (helpMenuIndex !== -1) {
            currentMenu.items[helpMenuIndex].submenu?.insert(0, new MenuItem({
                label: 'Global Shortcuts',
                click: () => {
                    createModal(mainWindow, "shortcuts.html")
                },
            }));
            currentMenu.append(new MenuItem({
                label: 'Http Server',
                click: () => {
                    createModal(mainWindow, "server.html",initServer)
                },
            }));
            Menu.setApplicationMenu(currentMenu);
        }
    }
});

app.on('window-all-closed', () => {
    globalShortcut.unregisterAll()
    app.quit();
});
createSingleInstance(mainWindow)

