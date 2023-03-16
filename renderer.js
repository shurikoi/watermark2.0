let settings = require("./settings.json"),
    folderPath = [],
    choosenImgs = [],
    choosenLogo = 0,
    themeImgUrls = {
        moon: "imgs/moon.png", 
        sun: "imgs/sun.png"
    }
    
const { ipcRenderer } = require('electron')
const fs = require("fs")

setTimeout(() => document.querySelector(".loader-wrapper").remove(), 300)  

let body = document.querySelector("body")
let toggleButton = document.querySelector(".toggle-button")
let toggleButtonImg = document.querySelector(".toggle-button-wrapper img")
let demo = document.querySelector(".demo-wrapper")
let logoItems = document.querySelectorAll(".logo-item")

function outputImgs(){
    document.querySelector(".choosen-files > span").textContent = choosenImgs.length
    document.querySelector(".demo-img").setAttribute("src", choosenImgs[0])
}

document.querySelector(".choose-path-button").addEventListener("click", () => {
    ipcRenderer.send("choose-folder")
    // dialog.showOpenDialog({properties: "openDirectory"}).then((result) => {
    //     console.log(result.filePaths)
    // })
})

ipcRenderer.on("choosen-files", (event, args) => {
    choosenImgs = args
    outputImgs()
})

ipcRenderer.on("folder-path", (event, args) => {
    let path = args
    if (path.length > 0){
        folderPath = path
        document.querySelector(".file-path").textContent = folderPath
    }
})

document.querySelector(".process-button").addEventListener("click", () => {
    if (choosenImgs.length > 0)
        ipcRenderer.send("process", choosenImgs)
})

ipcRenderer.on("app-closing", () => {
    settings.isDark = toggleButton.checked
    if (folderPath.length > 0)
        settings.lastPath = folderPath
    fs.writeFile("./settings.json", JSON.stringify(settings), () => {})
})


if (settings.isDark){
    body.classList.toggle("dark-mode")
    toggleButton.checked = true
    // toggleButtonImg.src = themeImgUrls.sun
}
// else{
//     toggleButtonImg.src = themeImgUrls.moon
// }


document.querySelector(".file-path").textContent = settings.lastPath

toggleButton.addEventListener("input", (e) => {
    body.classList.toggle("dark-mode")
    // if (e.target.checked)
    //     toggleButtonImg.src = themeImgUrls.sun
    // else
    //     toggleButtonImg.src = themeImgUrls.moon
})

demo.addEventListener("dragover", (e) => {
    e.preventDefault()
    console.log("over")
    demo.classList.add("dragover")

})

demo.addEventListener("dragleave", (e) => {
    demo.classList.remove("dragover")
})

let lastChoosenItem = 0

logoItems.forEach((elem, index) => {
    
    elem.addEventListener("click", (e) => {
        logoItems[lastChoosenItem].classList.remove("choosen-logo")
        logoItems[index].classList.add("choosen-logo")
        lastChoosenItem = index
    })
})

document.querySelector(".choose-files").addEventListener("click", () => {
    ipcRenderer.send("choose-files")
    document.querySelector(".clear-files").classList.remove("hidden")
})

demo.addEventListener("drop", (e) => {
    demo.classList.remove("dragover")
    choosenImgs = [...e.dataTransfer.files].map(el => el.path)

    console.log(e.dataTransfer.files)

    document.querySelector(".demo-wrapper").classList.remove("demo-border")
    document.querySelector(".demo-img").classList.add("demo-border")
    document.querySelector(".clear-files").classList.remove("hidden")

    outputImgs()
})

document.querySelector(".clear-files").addEventListener("click", () => {
    choosenImgs = []
    
    document.querySelector(".demo-wrapper").classList.add("demo-border")
    document.querySelector(".demo-img").classList.remove("demo-border")
    
    outputImgs()
})
