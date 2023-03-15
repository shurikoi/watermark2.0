let settings = require("./settings.json"),
    folderPath = [],
    choosenImgs = []
const { ipcRenderer } = require('electron')
const fs = require("fs")

setTimeout(() => document.querySelector(".loader-wrapper").remove(), 300)  

let body = document.querySelector("body")
let toggleButton = document.querySelector(".toggle-button")

document.querySelector(".choose-files").addEventListener("click", () => {
    ipcRenderer.send("choose-files")
    // dialog.showOpenDialog({properties: "openFiles, multiSelections"}).then((result) => {
    //     console.log(result.filePaths)
    // })
})

document.querySelector(".choose-path-button").addEventListener("click", () => {
    ipcRenderer.send("choose-folder")
    // dialog.showOpenDialog({properties: "openDirectory"}).then((result) => {
    //     console.log(result.filePaths)
    // })
})

ipcRenderer.on("choosen-files", (event, args) => {
    choosenImgs = args
    document.querySelector(".choosen-files > span").textContent = args.length
    document.querySelector(".demo-img").setAttribute("src", args[0])
    console.log(args, args.length)
})

ipcRenderer.on("folder-path", (event, args) => {
    let path = args
    if (path.length > 0){
        folderPath = path
        document.querySelector(".file-path").textContent = folderPath
    }
})

document.querySelector(".process-button").addEventListener("click", () => {
    ipcRenderer.send("process", choosenImgs)
})

ipcRenderer.on("app-closing", () => {
    settings.isDark = toggleButton.checked
    settings.lastPath = folderPath
    fs.writeFile("./settings.json", JSON.stringify(settings), () => {})
})


if (settings.isDark){
    body.classList.toggle("dark-mode")
    toggleButton.checked = true
}

document.querySelector(".file-path").textContent = settings.lastPath

toggleButton.addEventListener("input", () => {
    body.classList.toggle("dark-mode")
})