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

  fs.readdir(__dirname, (err, files) => {
    win.webContents.send("console-out", [files.path, files])
  })

  autoUpdater.checkForUpdatesAndNotify()

  autoUpdater.on("checking-for-update", () => {
    win.webContents.send("console-out", "checking")
  })

  autoUpdater.on("update-available", () => {
    win.webContents.send("console-out", "update-available")
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

    event.sender.send("console-out", [__dirname, path.join(__dirname, "watermarks_edge.exe"), [args.logo, args.imgs, args.folder, args.position]])

    // let process = spawn("powershell.exe", [path.join(__dirname, "watermarks_edge.exe"), args.logo, [args.imgs], args.folder, args.position])
    let process = spawn(path.join(__dirname, "watermarks_edge.exe"), [args.logo, args.imgs, args.folder, args.position])

    process.stderr.on("data", (data) => {
      win.webContents.send("console-out", "err " + data)
    })
    
    process.stdout.on("data", (data) => {
      win.webContents.send("console-out", data)
    })
    // let process = execFile(path.join(__dirname, "watermarks_edge.exe"), [args.logo, [args.imgs], args.folder, args.position], (err) => {
    //   win.webContents.send("console-out", err)
    // })

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
      }, 300)
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