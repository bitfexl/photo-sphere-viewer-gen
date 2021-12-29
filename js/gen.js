// the image to use (path or base64 url encoded)
let image;

// all user inputs available
let userConfig = {
    caption: "",
    help: true,
    fullscreen: true,
    move: false,
    zoom: true,
    zoomSlider: false,
    ctrlZoom: true,
    fisheye: false,
    minFov: 30,
    maxFov: 90,

    automaticRotation: true,
    automaticRotationHidden: false,
    autoRotateRPM: 1,
    autoRotateLat: 0,
    autoRotateDelay: 4,
    autoRotateCopyLat() {
        this.autoRotateLat = viewerData.currLat / Math.PI;
    },

    startingLat: 0,
    startingLong: 0,
    startingZoom: 50,

    startingPositionCopy() {
        this.startingLat = viewerData.currLat / Math.PI;
        this.startingLong = viewerData.currLong / Math.PI;
        this.startingZoom = viewerData.currZoomPercent;
    },
};

// output data to display
window.viewer = null;
let viewerData = {
    currLat: 0,
    currLong: 0,
    currFov: 90,
    currZoomPercent: 50,
    getConfig() {
        // generate code output, also output generated function (help); not valid json
        let config = getPSVConfig(userConfig);
        config.panorama = "PATH/TO/IMAGE.JPG";
        let configString = JSON.stringify(config, function (key, val) {
            if (typeof val === "function") {
                return "REPLACE FUNCTION";
            }
            return val;
        }).replace(':"REPLACE FUNCTION"', "() {" + helpButtonFnString + "}");

        let jsCode =
            "let viewer = new PhotoSphereViewer.Viewer(" + configString + ");";

        return jsCode;
    },
};

// periodically update viewerData
setInterval(function () {
    if (window.viewer != null) {
        viewerData.currFov = window.viewer.prop.vFov;
        let pos = window.viewer.getPosition();
        viewerData.currLat = pos.latitude;
        viewerData.currLong = pos.longitude;
        viewerData.currZoomPercent =
            100 -
            ((viewerData.currFov - userConfig.minFov) /
                (userConfig.maxFov - userConfig.minFov)) *
                100;
    }
}, 200);

// recompile the viewer with the current userConfig
function recompileViewer() {
    document.getElementById("viewer").innerHTML = "";
    let config = getPSVConfig(userConfig);
    console.log(config);
    window.viewer = new PhotoSphereViewer.Viewer(config);
}

function uploadFile() {
    const file = document.getElementById("imageUpload").files[0];
    const reader = new FileReader();

    reader.addEventListener(
        "load",
        function () {
            // convert image file to base64 string
            image = reader.result;
        },
        false
    );

    if (file) {
        reader.readAsDataURL(file);
    }
}

// generate photo sphere viewer config form user inputs
function getPSVConfig(input) {
    // generate navbar config
    let navbarConfig = [];

    if (input.automaticRotation && !input.automaticRotationHidden) {
        navbarConfig.push("autorotate");
    }

    if (input.zoom) {
        navbarConfig.push("zoomOut");
    }

    if (input.zoomSlider) {
        navbarConfig.push("zoomRange");
    }

    if (input.zoom) {
        navbarConfig.push("zoomIn");
    }

    if (input.move) {
        navbarConfig.push("move");
    }

    navbarConfig.push("caption");

    if (input.fullscreen) {
        navbarConfig.push("fullscreen");
    }

    if (input.help) {
        navbarConfig.push(helpButton);
    }

    // generate end result config
    let config = {
        container: "viewer",
        panorama: image,

        caption: input.caption || " ",

        autorotateSpeed: input.autoRotateRPM + "rpm",
        autorotateDelay: input.automaticRotation
            ? input.autoRotateDelay * 1000
            : 0,
        autorotateLat: input.autoRotateLat * Math.PI,

        defaultZoomLvl: input.startingZoom,
        minFov: input.minFov,
        maxFov: input.maxFov,

        defaultLat: input.startingLat * Math.PI,
        defaultLong: input.startingLong * Math.PI,

        navbar: navbarConfig,

        mousewheelCtrlKey: input.ctrlZoom,

        fisheye: input.fisheye,
    };

    return config;
}

document.addEventListener("alpine:init", () => {
    // add reactivity
    userConfig = Alpine.reactive(userConfig);
    viewerData = Alpine.reactive(viewerData);
});

// show help (mouse input)
const helpButton = {
    content: "<b>?</b>",
    title: "Help",
    onClick() {
        let tooltip = this.tooltip.create({
            top: 0,
            left: 15,
            position: "bottom right",
            content:
                "drag with <b>mouse</b> to <b>rotate</b><br/>use <b>scrollwheel</b> to <b>zoom</b>",
        });

        setTimeout(() => {
            tooltip.hide();
        }, 4000);
    },
};

// help function as string for generated code output
const helpButtonFnString =
    'let tooltip=this.tooltip.create({top:0,left:15,position:"bottom right",content:"drag with <b>mouse</b> to <b>rotate</b><br/>use <b>scrollwheel</b> to <b>zoom</b>"});setTimeout(()=>{tooltip.hide()},4000);';
