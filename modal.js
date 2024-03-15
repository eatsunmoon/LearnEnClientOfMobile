const { BrowserWindow } = require('electron');

function createModal(parent, filePath) {
    

    let win = new BrowserWindow({
        modal: true, // Make the window modal
        parent: parent, // Optional: Set parent window (for nesting)
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true, // Enables communication (optional)
            enableRemoteModule: true,
            contextIsolation: false,
            sandbox: false
        }
    });
    win.setMenu(null)


    win.loadFile(filePath); // Load the content for the modal window

    win.webContents.on('did-finish-load', async () => {
        // 当内容加载完成时，调整窗口大小以适应内容
        const contentSize = await win.webContents.executeJavaScript(`
        const rect = document.body.getBoundingClientRect();
        JSON.stringify({ width: rect.width, height: rect.height });
        `);
        const { width, height } = JSON.parse(contentSize);

        const childWidth = Math.round(width)+20;
        const childHeight = Math.round(height)+40;
        win.setSize(childWidth,childHeight );

        const parentBounds = parent.getBounds();
        

        const childX = Math.floor(parentBounds.x + (parentBounds.width - childWidth) / 2);
        const childY = Math.floor(parentBounds.y + (parentBounds.height - childHeight) / 2);
        win.setPosition(childX,childY)

        // 显示窗口
        win.show();
        parent.setEnabled(false)
    });


    win.on('closed', () => {
        win.destroy(); // Clean up resources
        win = null
        parent.setEnabled(true)
    });
}

module.exports = {
    createModal,
};
