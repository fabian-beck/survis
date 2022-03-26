// Based on: https://www.electronjs.org/docs/tutorial/first-app

const { app, BrowserWindow, shell, dialog } = require('electron')
const fs = require('fs');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        autoHideMenuBar: true
    })
    win.maximize();

    dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: [
            { name: 'Literature file (BibTeX)', extensions: ['bib', 'txt'] }
        ]
    }).then(result => {
        win.fileName = result.filePaths[0];
        // https://stackoverflow.com/questions/43722450/electron-function-to-read-a-local-file-fs-not-reading 
        fs.readFile(win.fileName, 'utf-8', (err, data) => {
            if (err) {
                dialog.showErrorBox("Error reading file", err.message)
                return;
            }
            global.sharedObject = {
                bibData: data
            }
            win.loadFile('index-electron.html')
            //win.webContents.openDevTools()
        });

    }).catch(err => {
        dialog.showErrorBox("Error reading file", err.message);
    })

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    })

    // Open links in standard browser
    // https://github.com/electron/electron/issues/1344
    win.webContents.on('new-window', function (event, url) {
        event.preventDefault();
        shell.openExternal(url);
    });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})

const ipc = require('electron').ipcMain;
ipc.on('saveFile', (event, messages) => {
    try {
        fs.writeFileSync(win.fileName, global.sharedObject.bibData, 'utf-8');
    } catch (err) {
        dialog.showErrorBox("Error saving file", err.message);
    }
});