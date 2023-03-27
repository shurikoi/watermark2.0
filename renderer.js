setTimeout(() => document.querySelector(".loader-wrapper").remove(), 300)  

const { ipcRenderer } = require('electron')
const fs = require("fs")
const os = require("os")
const path = require("path")

const allowedExtensions = ["jpg", "png"]
const logo = ["imgs/logo.png", "imgs/logo-en.png", "imgs/logo-white.png"]

let settings

try {
    settings = require(path.join(__dirname, "settings.json"))
}catch(err){
    settings = {
        isDark: true,
        path: path.join(os.homedir(), "Downloads"),
        position: 1,
        logo: 0
    }
}
let choosenImgs = []

const body = document.querySelector("body")
const toggleButton = document.querySelector(".toggle-button")
const demo = document.querySelector(".demo-wrapper")
const demoImg = document.querySelector(".demo-img")
const demoLogo = document.querySelector(".demo-logo")
const processBtn = document.querySelector(".process-button")
const logoItems = document.querySelectorAll(".logo-item")
const positionInputs = document.querySelectorAll("[name=position]")
const logoInputs = document.querySelectorAll("[name=logo]")
const modalWindow = document.querySelector(".modal-window")

document.querySelector(".file-path").textContent = settings.path

function writeSettings(){
    fs.writeFile(path.join(__dirname, "settings.json"), JSON.stringify(settings), () => {})
}

function outputImgs(){
    document.querySelector(".choosen-files > span").textContent = choosenImgs.length
    
    if (choosenImgs.length > 0){
        demoImg.setAttribute("src", choosenImgs[0])

        demo.classList.remove("demo-border")
        demoImg.classList.add("demo-border")

        document.querySelector(".clear-files").classList.remove("hidden")
        document.querySelector(".choose-files-button-wrapper").classList.add("hidden")

        demoImg.onload = () => {
            const imgWidth = parseInt(window.getComputedStyle(demoImg).getPropertyValue("width"))
            const imgHeight = parseInt(window.getComputedStyle(demoImg).getPropertyValue("height"))

            if (imgWidth > imgHeight)
                demoLogo.classList.add("vertical")
            else
                demoLogo.classList.remove("vertical")
        }
    }
    else{
        demoImg.setAttribute("src", "")

        demo.classList.add("demo-border")
        demoImg.classList.remove("demo-border")
        document.querySelector(".clear-files").classList.add("hidden")
        document.querySelector(".choose-files-button-wrapper").classList.remove("hidden")
    }
}

document.querySelector(".close-modal-window").addEventListener("click", () => {
    modalWindow.classList.add("hidden")
})

document.querySelector(".download-btn").addEventListener("click", () => {
    ipcRenderer.send("start-download")
})

let total

ipcRenderer.on("update-available", (event, info) => {
    modalWindow.classList.remove("hidden")
    total = info.files.reduce((acc, el) => acc + el.size, 0)
})

ipcRenderer.on("download-progress", (event, progressInfo) => {
    document.querySelector(".download-progress-bar").style.width = progressInfo.transferred / total * 100 + "%"
})

ipcRenderer.on("console-out", (event, args) => console.log(args))

document.querySelector(".choose-path-button").addEventListener("click", () => {
    ipcRenderer.send("choose-folder")

    ipcRenderer.once("folder-path", (event, args) => {
        if (args != ""){
            settings.path = args
            document.querySelector(".file-path").textContent = args
        }
        writeSettings()
    })
})

let lastChoosenItem = 0

logoInputs.forEach((logoBtn, index) => {
    logoBtn.addEventListener("input", (event) => {
        logoItems[lastChoosenItem].classList.remove("choosen-logo")
        logoItems[index].classList.add("choosen-logo")
        lastChoosenItem = index
        
        demoLogo.setAttribute("src", logo[index])
        settings.logo = index
        writeSettings()
    })
})

positionInputs.forEach((positionBtn, index) => {
    positionBtn.addEventListener("input", (event) => {
        demoLogo.id = event.target.dataset.id
        settings.position = event.target.dataset.index
        writeSettings()
    })
})


positionInputs[settings.position - 1].checked = logoInputs[settings.logo].checked = true
positionInputs[settings.position - 1].dispatchEvent(new Event("input"))
logoInputs[settings.logo].dispatchEvent(new Event("input"))

processBtn.addEventListener("click", () => {
    if (choosenImgs.length > 0){     
        document.querySelector(".progress-bar").style.width = "0%"

        ipcRenderer.on("progress", (event, args) => {
            document.querySelector(".progress-bar").style.width = `${args * 100}%`
        })

        ipcRenderer.send("process", {
            imgs: choosenImgs,
            folder: settings.path,
            logo: logo[settings.logo],
            position: settings.position
        })
        
        processBtn.setAttribute("disabled", "disabled")
    }
})

if (settings.isDark == true){
    body.classList.toggle("dark-mode")
    toggleButton.checked = true
}

toggleButton.addEventListener("input", (e) => {
    body.classList.toggle("dark-mode")
    settings.isDark = !settings.isDark
    writeSettings()
})

demo.addEventListener("dragover", (e) => {
    e.preventDefault()
    demo.classList.add("dragover")
})

demo.addEventListener("dragleave", (e) => {
    e.preventDefault()
    demo.classList.remove("dragover")
})

demo.addEventListener("drop", (e) => {
    e.preventDefault()
    demo.classList.remove("dragover")
    demo.style.width = imgWidth + "px"
    demo.style.height = imgHeight + "px"
})

document.querySelector(".choose-files").addEventListener("click", () => {
    ipcRenderer.send("choose-files")
    ipcRenderer.once("choosen-files", (event, args) => {
        choosenImgs = args
        outputImgs()
    })
})

demo.addEventListener("drop", (e) => {
    demo.classList.remove("dragover")

    let files = [...e.dataTransfer.files]
    choosenImgs = []
    
    files.forEach(elem => {
        if (allowedExtensions.includes(elem.path.toLowerCase().split(".").at(-1)))
            choosenImgs.push(elem.path) 
    })

    outputImgs()
})

document.querySelector(".clear-files").addEventListener("click", () => {
    choosenImgs = []
    
    outputImgs()
})
