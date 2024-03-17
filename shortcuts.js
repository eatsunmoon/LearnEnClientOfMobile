const { BrowserWindow, globalShortcut } = require('electron');
const StateManager = require('./stateManager.js')


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

function registerBossShortcuts(win) {
    globalShortcut.register('CommandOrControl+Shift+PageUp', () => {
        if(BrowserWindow.getFocusedWindow()==null){
            win.show()
            StateManager.state.mainHidden=false
            return
        }
        if (hide) {
            StateManager.state.mainHidden=false
            win.show()
        } else {
            StateManager.state.mainHidden=true
            win.hide()
        }
    });
    globalShortcut.register('CommandOrControl+Shift+PageDown', () => {
        console.log(registered)
        if (registered) {
            globalShortcut.unregisterAll()
            setTimeout(() => {
                registerBossShortcuts(win)
                StateManager.state.shortcutsRegistered=false
            }, 100);
        } else {
            registerGlobalShortcus(win)
            StateManager.state.shortcutsRegistered=true
        }
    });
}

module.exports={
    registerBossShortcuts,
    registerGlobalShortcus
}
