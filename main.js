const { ipcMain, dialog, app, BrowserWindow } = require('electron')
const { spawn } = require("child_process")
const { autoUpdater } = require("electron-updater")
const fs = require("fs")
const path = require("path")


const createWindow = () => {
  const win = new BrowserWindow({
    width: 940,
    height: 700,
    resizable: false,
    title: "Watermarks-edge",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')

  autoUpdater.autoDownload = false

  autoUpdater.on("checking-for-update", () => {
    console.log("checking")
  })

  autoUpdater.on("update-available", () => {
    console.log("update available")
  })

  console.log(app.getVersion())

  ipcMain.on("choose-files", (event) => {
    dialog.showOpenDialog({ properties: ["openFile", "multiSelections"], filters: [{ name: "Images", extensions: ["jpg", "png"] }] }).then((result) => {
      console.log(result)
      if (result.filePaths.length > 0)
        event.sender.send("choosen-files", result.filePaths)
    })
  })

  ipcMain.on("choose-folder", (event) => {
    dialog.showOpenDialog({ properties: ["openDirectory"] }).then((result) => {
      console.log(result.filePaths)
      if (result.filePaths.length > 0)
        event.sender.send("folder-path", ...result.filePaths)
    })
  })

  ipcMain.on("process", (event, args) => {
    console.log(args)
    let process = spawn(path.join(__dirname, "watermarks_edge.exe"), [args.logo, [args.imgs], args.folder, args.position])

    let filesCount = 0
    console.log(args.folder)
    fs.readdir(args.folder, (err, files) => {
      filesCount = files.length
    })
    
    console.log(filesCount)

    let interval = setInterval(() => {
      fs.readdir(args.folder, (err, files) => {
        let progress = (files.length - filesCount) / args.imgs.length
        console.log(files.length, filesCount, args.imgs.length)
        event.sender.send("progress", progress)
        win.setProgressBar(progress)
      })
    }, 250)

    process.on("close", () => {
      setTimeout(() => {
        clearInterval(interval)
        win.setProgressBar(0)
        console.log("interval cleared")
      }, 1000)
    })

  })

  win.on("close", (e) => {
    win.webContents.send("app-closing")
    console.log("closing")
  })
}

app.whenReady().then(() => {
  createWindow()
})