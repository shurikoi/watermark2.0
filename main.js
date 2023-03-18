const { ipcMain, dialog, app, BrowserWindow } = require('electron')
const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")

const logo = ["imgs/logo.png", "imgs/logo-en.png", "imgs/logo-white.png"]

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

  ipcMain.on("choose-files", () => {
    dialog.showOpenDialog({ properties: ["openFile", "multiSelections"], filters: [{ name: "Images", extensions: ["jpg", "png"] }] }).then((result) => {
      console.log(result)
      if (result.filePaths.length > 0)
        win.webContents.send("choosen-files", result.filePaths)
    })
  })

  ipcMain.on("choose-folder", () => {
    dialog.showOpenDialog({ properties: ["openDirectory"] }).then((result) => {
      console.log(result.filePaths)
      if (result.filePaths.length > 0)
        win.webContents.send("folder-path", result.filePaths)
    })
  })

  ipcMain.on("process", (event, args) => {
    console.log(args)
    let process = spawn(path.join(__dirname, "watermarks_edge.exe"), [logo[args.logo], [args.imgs], args.folder, args.corner])

    let filesCount = 0

    fs.readdir("C:/Users/verbo/Desktop/imgs_for_test/rendered imgs", (err, files) => {
      filesCount = files.length
    })

    console.log(filesCount)
    let interval = setInterval(() => {
      fs.readdir("C:/Users/verbo/Desktop/imgs_for_test/rendered imgs", (err, files) => {
        win.setProgressBar((files.length - filesCount) / args.imgs.length)
      })
    }, 250)

    process.on("close", () => {
      clearInterval(interval)
      win.setProgressBar(0)
      console.log("interval cleared")
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