const { ipcMain, dialog, app, BrowserWindow, Menu} = require('electron')
const { autoUpdater } = require("electron-updater")
const path = require("path")

let sharp

try{
  sharp = require(path.join(__dirname, "..", "app.asar.unpacked", "node_modules", "sharp"))
}catch(err){
  sharp = require("sharp")
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 940,
    height: 700,
    resizable: false,
    title: "FRI Logo Maker",
    icon: 'logo.png',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')

  win.webContents.send("app-version", app.getVersion())

  let menu = Menu.buildFromTemplate([])

  Menu.setApplicationMenu(menu)

  let progress
  let imgsLength

  async function compositeImages(img, folder, logo, position) {
    const imgMetaData = await sharp(img).metadata()
    win.webContents.send("console-out", imgMetaData)
    if ((imgMetaData.orientation || 0) >= 5)
      [imgMetaData.width, imgMetaData.height, imgMetaData.orientation] = [imgMetaData.height, imgMetaData.width, 1]
    
    console.log(imgMetaData)
    
    let logoPosition = [0, 0]
    let logoSize = Math.round(((imgMetaData.width > imgMetaData.height)? imgMetaData.width: imgMetaData.height) / 7.86)
    win.webContents.send("console-out", [logoSize, logo])

    let logoImg = await sharp(logo).resize({width: logoSize, height: logoSize}).toBuffer()
    win.webContents.send("console-out", [logoImg, logo])
    let logoMetaData = await sharp(logoImg).metadata()
    win.webContents.send("console-out", logoMetaData)

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
      
      console.log("position" + logoPosition)
      
    await sharp(img).rotate().composite([
      {
        input: logoImg,
        top: logoPosition[1],
        left: logoPosition[0],
      },  
    ]).toFile(path.join(folder, "logo_" + img.split("\\").at(-1))).then(() => {
      let progressBarValue = ++progress / imgsLength 
      win.webContents.send("progress", progressBarValue)
      win.setProgressBar(progressBarValue)
      if (progress == imgsLength)
        setTimeout(() => {
          win.setProgressBar(-1)
          win.webContents.send("process-ended")
        }, 2000)
    })
    
  }
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.autoRunAppAfterInstall = true
  autoUpdater.checkForUpdates()
  
  autoUpdater.on("checking-for-update", () => {
    win.webContents.send("console-out", "checking")
  })
  
  autoUpdater.on("update-available", (updateInfo) => {
    win.webContents.send("update-available", updateInfo)
  })
  
  ipcMain.on("start-download", () => {
    autoUpdater.downloadUpdate()
  })

  autoUpdater.on("download-progress", (progressInfo) => {
    win.webContents.send("download-progress", progressInfo)
  })
  
  autoUpdater.on("update-downloaded", () => {
    setTimeout(() => {
      autoUpdater.quitAndInstall(true, true)
    }, 1000)
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
    win.setProgressBar(-1)
    progress = 0
    imgsLength = args.imgs.length
    
    args.imgs.forEach((img) => {
      compositeImages(img, args.folder, path.join(__dirname, "imgs", args.logo), args.position)
    })
  })
}

app.whenReady().then(() => {
  app.on("window-all-closed", () => {
    app.exit()
  })

  createWindow()
})