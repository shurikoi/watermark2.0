const { ipcMain, dialog, app, BrowserWindow } = require('electron')
const { spawn } = require("child_process")
const fs = require("fs")
const createWindow = () => {
  const win = new BrowserWindow({
    width: 940,
    height: 600,
    resizable: false,
    title: "Watermarks-edge",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  
  win.setProgressBar(0.63)

  win.loadFile('index.html')
  
  ipcMain.on("choose-files", () => {
    dialog.showOpenDialog({properties: ["openFile", "multiSelections"]}).then((result) => {
      console.log(result.filePaths)
      win.webContents.send("choosen-files", result.filePaths)
    })
  })
  
  ipcMain.on("choose-folder", () => {
    dialog.showOpenDialog({properties: ["openDirectory"]}).then((result) => {
      console.log(result.filePaths)
      win.webContents.send("folder-path", result.filePaths)
    })
  })

  ipcMain.on("process", (args) => {
    let process = spawn("./watermarks_edge.exe", ["-u"])
    console.log(args)
    process.stdout.setEncoding('utf8')

    process.stdout.on("data", (data) => console.log(data))

  })
  // dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] }).then(result => {
    //   console.log(result)
    // }).catch(err => {
      //   console.log(err)
      // })
    win.on("close", (e) => {
      win.webContents.send("app-closing")
    })
}
    

  
app.whenReady().then(() => {
  createWindow()
})