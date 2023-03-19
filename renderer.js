setTimeout(() => document.querySelector(".loader-wrapper").remove(), 300)  

let settings = require("./settings.json"),
    folderPath = settings.lastPath,
    choosenImgs = [],
    choosenLogo = 0

const { ipcRenderer } = require('electron')
const fs = require("fs")

const allowedExtensions = ["jpg", "png"]
const logo = ["imgs/logo.png", "imgs/logo-en.png", "imgs/logo-white.png"]

const body = document.querySelector("body")
const toggleButton = document.querySelector(".toggle-button")
const demo = document.querySelector(".demo-wrapper")
const demoImg = document.querySelector(".demo-img")
const demoLogo = document.querySelector(".demo-logo")
const logoItems = document.querySelectorAll(".logo-item")
const processBtn = document.querySelector(".process-button")

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

        if (img.width > img.height)
            demoLogo.classList.add("vertical")
        else
            demoLogo.classList.remove("vertical")
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

document.querySelectorAll("[name=logo]").forEach(positionBtn => {
    positionBtn.addEventListener("input", (event) => {
        demoLogo.setAttribute("src", logo[event.target.dataset.index])
    })
})

document.querySelectorAll("[name=position]").forEach(positionBtn => {
    positionBtn.addEventListener("input", (event) => {
        demoLogo.id = event.target.id
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
            logo: logo[document.querySelector("[name=logo]:checked").dataset.index],
            corner: document.querySelector("[name=position]:checked").dataset.index
        })
        
        processBtn.setAttribute("disabled", "disabled")
    }
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
