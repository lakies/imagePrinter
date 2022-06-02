const brother = require('brother-label-printer');
const Jimp = require("jimp")
const chokidar = require('chokidar');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');

const watcher = chokidar.watch('images', {persistent: true, ignoreInitial: true});

let watcherSetup = false

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const printerUrl = config["printerUrl"];

const printImages = (path) => {
    try {
        Jimp.read(path, function (err, image) {
            if (err) {
                console.log("error converting image", err)
            } else {
                const png = "./pngs/" + path + ".png"
                image.write(png)
                brother.printPngFile(printerUrl, png, {landscape: false})
            }
        })

    } catch(error) {
        console.log("Printing failed", e)
    }
}

const syncFiles = async () => {
    try {
        await exec(`rsync -auz ${config["user"]}@${config["host"]}:${config["hostDir"]} .`)

        if(!watcherSetup) {
            watcher
                .on('add', printImages)
                .on('error', function(error) {console.error('Error happened', error);});
            watcherSetup = true
        }
    } catch (error) {
        console.log("Image fetching failed", error)
    }

    setTimeout(syncFiles, 250);
}

syncFiles()
