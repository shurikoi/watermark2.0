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
        isDark: "false",
        path: path.join(os.homedir(), "Downloads"),
        position: 1,
        logo: 0
    }
}
let folderPath = settings.path,
    choosenImgs = []

const body = document.querySelector("body")
const toggleButton = document.querySelector(".toggle-button")
const demo = document.querySelector(".demo-wrapper")
const demoImg = document.querySelector(".demo-img")
const demoLogo = document.querySelector(".demo-logo")
const processBtn = document.querySelector(".process-button")
const logoItems = document.querySelectorAll(".logo-item")
const positionInputs = document.querySelectorAll("[name=position]")
const logoInputs = document.querySelectorAll("[name=logo]")

document.querySelector(".file-path").textContent = folderPath

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

        let img = new Image()
        
        img.src = choosenImgs[0] 
        
        img.onload = () => {
            if (img.width > img.height)
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

ipcRenderer.on("checking", () => {
    console.log("checking")
})

ipcRenderer.on("update-available", () => {
    console.log("update is here")
})

document.querySelector(".choose-path-button").addEventListener("click", () => {
    ipcRenderer.send("choose-folder")

    ipcRenderer.once("folder-path", (event, args) => {
        if (args != ""){
            folderPath = args
            settings.path = folderPath
            document.querySelector(".file-path").textContent = folderPath
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

ipcRenderer.on("console-out", (event, args) => console.log(args))

positionInputs[settings.position - 1].checked = true
positionInputs[settings.position - 1].dispatchEvent(new Event("input"))

logoInputs[settings.logo].checked = true
logoInputs[settings.logo].dispatchEvent(new Event("input"))

processBtn.addEventListener("click", () => {
    if (choosenImgs.length > 0){     
        ipcRenderer.on("progress", (err, args) => {
            console.log("args", args)
            document.querySelector(".progress-bar").style.width = `${args * 100}%`
        })

        ipcRenderer.send("process", {
            imgs: choosenImgs,
            folder: folderPath,
            logo: logo[settings.logo],
            position: settings.position
        })
        
        processBtn.setAttribute("disabled", "disabled")
    }
})

ipcRenderer.on("app-closing", () => {
})

if (settings.isDark == true){
    console.log(settings.isDark)
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
    console.log("over")
    demo.classList.add("dragover")

})

demo.addEventListener("dragleave", (e) => {
    demo.classList.remove("dragover")
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
        if (allowedExtensions.includes(elem.path.split(".").at(-1)))
            choosenImgs.push(elem.path) 
    })

    outputImgs()
})

document.querySelector(".clear-files").addEventListener("click", () => {
    choosenImgs = []
    
    outputImgs()
})
