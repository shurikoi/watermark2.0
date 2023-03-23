const { ipcMain, dialog, app, BrowserWindow } = require('electron')
const { autoUpdater } = require("electron-updater")
const sharp = require("sharp")
const fs = require("fs")
const path = require("path")

const createWindow = () => {
  const win = new BrowserWindow({
    width: 940,
    height: 700,
    resizable: false,
    title: "watermarks",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')

  let progress
  let imgsLength

  async function compositeImages(img, folder, logo, position) {
    const imgMetaData = await sharp(img).metadata()
    
    let logoPosition = [0, 0]
    let logoSize
  
    if (imgMetaData.width > imgMetaData.height)
        logoSize = Math.round(imgMetaData.width / 7.86)
    else
        logoSize = Math.round(imgMetaData.height / 7.86)
  
    let logoImg = await sharp(path.join(__dirname, logo)).resize({width: logoSize, height: logoSize}).toBuffer()
    let logoMetaData = await sharp(logoImg).metadata()

    switch(position){
      case('1'):
        logoPosition = [0, 0]
        break
      case('2'):
        logoPosition = [imgMetaData.width - logoMetaData.width, 0]
        break
      case('3'):
        logoPosition = [0, imgMetaData.height - logoMetaData.height]
        break
      case('4'):
        logoPosition = [imgMetaData.width - logoMetaData.width, imgMetaData.height - logoMetaData.height]
        break
    }
    
    await sharp(img).composite([
      {
        input: logoImg,
        top: logoPosition[1],
        left: logoPosition[0],
      },  
    ]).toFile(path.join(folder, "logo_" + img.split("\\").at(-1))).then(() => {
      let progressBarValue = ++progress / imgsLength 
      win.webContents.send("progress", progressBarValue)
      win.setProgressBar(progressBarValue)
    })
    
  }
  autoUpdater.autoDownload = false
  autoUpdater.checkForUpdates()

  autoUpdater.on("checking-for-update", () => {
    win.webContents.send("console-out", "checking")
  })

  autoUpdater.on("update-available", (updateInfo) => {
    win.webContents.send("update-available", updateInfo)
  })

  ipcMain.on("start-download", () => {
    autoUpdater.downloadUpdate().then((data) => {
      win.webContents.send("console-out", data)
    })
  })

  autoUpdater.on("download-progress", (progressInfo) => {
    win.webContents.send("download-progress", progressInfo)
  })

  ipcMain.on("choose-files", (event) => {
    dialog.showOpenDialog({ properties: ["openFile", "multiSelections"], filters: [{ name: "Images", extensions: ["jpg", "png"] }] }).then((result) => {
      if (result.filePaths.length > 0)
        event.sender.send("choosen-files", result.filePaths)
    })
  })

  ipcMain.on("choose-folder", (event) => {
    dialog.showOpenDialog({ properties: ["openDirectory"] }).then((result) => {
      if (result.filePaths.length > 0)
        event.sender.send("folder-path", ...result.filePaths)
    })
  })

  ipcMain.on("process", (event, args) => {
    progress = 0
    imgsLength = args.imgs.length

    args.imgs.forEach((img, index) => {
      compositeImages(img, args.folder, args.logo, args.position)
    })
})

  win.on("close", (e) => {
    win.webContents.send("app-closing")
  })
}

app.whenReady().then(() => {
  createWindow()
  
})