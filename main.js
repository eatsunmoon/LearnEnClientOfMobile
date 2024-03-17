const { app, BrowserWindow, ipcMain, globalShortcut, Menu, MenuItem } = require('electron');
const { createModal } = require('./modal.js')
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

    win.loadFile('index.html');
    win.on('close', () => {
        app.exit()
    })

    ipcMain.on('load-url', (event, url) => {
        win.loadURL(url);
    });
    return win
};

function registerGlobalShortcus(win) {
    globalShortcut.register('CommandOrControl+Left', () => {
        !BrowserWindow.getFocusedWindow() && win.webContents.executeJavaScript('window.rewind&&window.rewind()');
    });

    globalShortcut.register('CommandOrControl+Right', () => {
        !BrowserWindow.getFocusedWindow() && win.webContents.executeJavaScript('window.forward&&window.forward()');

    });

    globalShortcut.register('CommandOrControl+End', () => {
        !BrowserWindow.getFocusedWindow() && win.webContents.executeJavaScript('window.toggleSub&&window.toggleSub()');
    });

    globalShortcut.register('CommandOrControl+Space', () => {
        !BrowserWindow.getFocusedWindow() && win.webContents.executeJavaScript('window.togglePlay&&window.togglePlay()');
    });
}

var registered = true
var hide=false
function registerBossShortcuts(win) {
    globalShortcut.register('CommandOrControl+Shift+PageUp', () => {
        if(BrowserWindow.getFocusedWindow()==null){
            win.show()
            hide=false
            return
        }
        if (hide) {
            hide=false
            win.show()
        } else {
            hide=true
            win.hide()
        }
    });
    globalShortcut.register('CommandOrControl+Shift+PageDown', () => {
        console.log(registered)
        if (registered) {
            globalShortcut.unregisterAll()
            setTimeout(() => {
                registerBossShortcuts(win)
                registered = false
            }, 100);
        } else {
            registerGlobalShortcus(win)
            registered = true
        }
    });
}



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
            Menu.setApplicationMenu(currentMenu);
        }
    }
});

app.on('window-all-closed', () => {
    globalShortcut.unregisterAll()
    app.quit();
});
createSingleInstance(mainWindow)

