setTimeout(() => document.querySelector(".loader-wrapper").remove(), 300)  

const { ipcRenderer } = require('electron')
const fs = require("fs")
const os = require("os")
const path = require("path")

const allowedExtensions = ["jpg", "png"]
const logo = ["imgs/logo.png", "imgs/logo-en.png", "imgs/logo-white.png"]

let settings

try {
    settings = require("./settings.json")
    console.log("settings setted")
}catch(err){
    settings = {
        isDark: "false",
        path: path.join(os.homedir(), "Downloads"),
        position: 1,
        logo: 0
    }
    console.log("settings setted")
}
let folderPath = settings.path,
    choosenImgs = []

const body = document.querySelector("body")
const toggleButton = document.querySelector(".toggle-button")
const demo = document.querySelector(".demo-wrapper")
const demoImg = document.querySelector(".demo-img")
const demoLogo = document.querySelector(".demo-logo")
const logoItems = document.querySelectorAll(".logo-item")
const processBtn = document.querySelector(".process-button")


document.querySelector(".file-path").textContent = settings.path
document.querySelectorAll("[name=position]")[settings.position - 1].checked = true
document.querySelectorAll("[name=logo]")[settings.logo].checked = true
console.log("init")
function writeSettings(){
    console.log(settings)
    fs.writeFile("./settings.json", JSON.stringify(settings), () => {})
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

document.querySelector(".choose-path-button").addEventListener("click", () => {
    ipcRenderer.send("choose-folder")

    ipcRenderer.once("folder-path", (event, args) => {
        console.log(args)
        if (args != ""){
            settings.path = args
            
            document.querySelector(".file-path").textContent = settings.path
        }
        writeSettings()
    })
})

let lastChoosenItem = 0

document.querySelectorAll("[name=logo]").forEach((logoBtn, index) => {
    logoBtn.addEventListener("input", (event) => {
        logoItems[lastChoosenItem].classList.remove("choosen-logo")
        logoItems[index].classList.add("choosen-logo")
        lastChoosenItem = index

        demoLogo.setAttribute("src", logo[index])

        settings.logo = index

        writeSettings()
    })
})

document.querySelectorAll("[name=position]").forEach((positionBtn, index) => {
    positionBtn.addEventListener("input", (event) => {
        demoLogo.id = event.target.id
        settings.position = event.target.dataset.index
        writeSettings()
    })
})

processBtn.addEventListener("click", () => {
    if (choosenImgs.length > 0){     
        ipcRenderer.on("progress", (err, args) => {
            console.log("args", args)
            document.querySelector(".progress-bar").style.width = `${args * 100}%`
        })

        console.log(typeof(choosenImgs), choosenImgs)
        
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
    // toggleButtonImg.src = themeImgUrls.sun
}
// else{
//     toggleButtonImg.src = themeImgUrls.moon
// }


toggleButton.addEventListener("input", (e) => {
    body.classList.toggle("dark-mode")
    settings.isDark = !settings.isDark
    writeSettings()
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
