// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
var path = require('path')
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600, icon: path.join(__dirname, 'assets/icons/png/icon_32x32@2x.png')})

    //quit when the windows are closed.
    mainWindow.on('closed', () => {
        mainWindow = null;
        app.quit();
    });
    mainWindow.setTitle(require('./package.json').name);
  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

    mainWindow.on('will-navigate', handleRedirect)
    mainWindow.on('new-window', handleRedirect)

}

var handleRedirect = (e, url) => {
  if(url != mainWindow.getURL()) {
    e.preventDefault()
    require('electron').shell.openExternal(url)
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
