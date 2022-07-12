const MPrint = require('./modules/MPrint');
const cups = require('ncups');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
var Client = require('node-rest-client').Client;
const async = require('async');
const { spawn } = require('child_process');
const Api = require('./modules/Api');
const md5 = require('md5');

var http = require("http");
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
const Jimp = require("jimp")
const chokidar = require('chokidar');
const util = require('util');
const { exec } = require("child_process");
// const exec = util.promisify(require('child_process').exec);
const fs = require('fs');

const addPrinters = async () => {
    return new Promise(async (resolve, reject) => {
        let adapter = new FileSync('printers.json')
        let db = low(adapter)

        // Set some defaults
        db.defaults({ printers: [], next_id: 1 })
            .write();

        let printers = await cups.list();

        printers.forEach((printer) => {
            let next_id = db.get('next_id').value();

            let existingPrinter = db.get('printers')
                .find({ uri: printer.uri })
                .value();

            if (typeof existingPrinter == 'undefined') {
                let type = printer.uri.substr(0, 3);

                db.get('printers')
                    .push({
                        id: next_id,
                        name_unique: md5(printer.name + printer.uri),
                        name: printer.name,
                        uri: printer.uri,
                        type: type,
                        size_px: '306x991',
                        size_mm: '29x90',
                        status: 'online'
                    })
                    .write();
/*
db.get('printers')
                    .push({
                        id: next_id,
                        name_unique: md5(printer.name + printer.uri),
                        name: printer.name,
                        uri: printer.uri,
                        type: type,
                        size_px: '696x271',
                        size_mm: '62x29',
                        status: 'online'
                    })
                    .write();*/
                db.set('next_id', next_id + 1)
                    .write();
            }
        });

        resolve();
    });
}

const updatePrinters = async () => {
    return new Promise(async (resolve, reject) => {
        let printers = MPrint.getPrinters();

        printers.value().forEach(async (printer) => {
            let currentStatus = await MPrint.getPrinterStatus(printer.name, printer.type);

            printers
                .find({ uri: printer.uri })
                .assign({ status: currentStatus })
                .write();
        });

        // try {
        //     await Api.updateMailbowPrinters();
        // } catch (err) {
        //     console.log('Error: ' + err);
        // }

        resolve();
    });
}

const sync = async () => {
    return new Promise(async (resolve, reject) => {
        await (async () => {
            return new Promise((resolve, reject) => {
                let cancel = spawn('cancel', ['-a']);
                cancel.on('close', () => {
                    resolve();
                });
            });
        })();

        await (async () => {
            return new Promise((resolve, reject) => {
                let restart = spawn('sudo', ['-u', 'printserver', 'systemctl', 'restart', 'cups']);
                restart.on('close', () => {
                    resolve();
                });
            });
        })();

        await updatePrinters();
        resolve();
    });
}

const images = new Set()
const watcher = chokidar.watch('images', {persistent: true, ignoreInitial: true});

let watcherSetup = false

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const target = `${config["user"]}@${config["host"]}`

const syncFiles = async () => {
    try {
        exec(`rsync -auz ${target}:${config["hostDir"]} ./images`)

        if(!watcherSetup) {
            watcher
                .on('add', path => {
                    console.log(path)
                    if (path.endsWith(".jpg") || path.endsWith(".jpeg")) {
                        images.add(path)
                    }
                })
                .on('error', function(error) {console.error('Error happened', error);});
            watcherSetup = true
        }
    } catch (error) {
        console.log("Image fetching failed", error)
    }
}


const getPrinterCount = () => {
    let adapter = new FileSync('printers.json')
    let db = low(adapter)

    return db.get('printers')
        .size()
        .value();
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const printImages = async () => {
    await syncFiles()
    const imagePath = images.values().next().value

    if (imagePath) {
        images.delete(imagePath)
        // await delay(2000)
        console.log(new Date().toISOString() + ' Printing image: ' + imagePath);
        const printer = MPrint.getPrinters().value()[0];    

        Jimp.read(imagePath, async function (err, image) {
            if (err) {
                if (err.message.startsWith("Could not find MIME")) {
                    images.add(imagePath)
                    console.log("Image not ready yet, retrying")
                    await delay(200)
                } else {
                    console.log("error converting image", err)
                }

            } else {
                try {
                    const png = "./pngs/" + imagePath + ".png"
                    console.log("creating png " + png)
                    await image
                        .resize(306, 991)
                        .writeAsync(png)

                    console.log("printing image " + png)
                    
                    let printResult = await MPrint.print(printer, imagePath, png);

                    switch (printResult) {
                        case null: // timeout
                            console.log('Job timeout:');
                            break;
            
                        case true: // ok
                            console.log('Job ready:');
                            break;
            
                        case false: // error
                            console.log('Job error:');
                            break;
                    }
                    
                    fs.unlinkSync(png);
                    // fs.unlinkSync(imagePath);
                    exec(`rm -rf ${imagePath}`)
                
                    const remoteFile = imagePath.split("/").splice(2).join("/")
                    const command = `ssh ${target} 'rm -rf ${config["hostDir"]}/${remoteFile}'`
                    console.log(command)
                    exec(command)
                } catch(error) {
                    console.log("Printing failed", error)
                }
            }

            setTimeout(printImages, 250);
        })
    } else {
        setTimeout(printImages, 250);
    }
    // socket.on('update', async () => {
    //     await (async () => {
    //         return new Promise((resolve, reject) => {
    //             let git = spawn('git', ['pull']);
    //             git.on('close', () => {
    //                 resolve();
    //             });
    //         });
    //     })();

    //     await sync();
    //     process.exit(0);
    // });


}

const startUi = () => {
    let adapter = new FileSync('mb_config.json')
    let db = low(adapter)

    // Set some defaults
    db.defaults({ url: '', user: '', password: '' })
        .write();

    // Running Server Details.
    var server = app.listen(8080, function () {
        var host = server.address().address
        var port = server.address().port
        //console.log("Example app listening at %s:%s Port", host, port)
    });
    app.use(express.static('public'))
    app.set('view engine', 'pug')
    app.get('/', function (req, res) {
        res.render('ui', {
            url: db.get('url').value(),
            user: db.get('user').value(),
            password: db.get('password').value()
        });
    });

    app.post('/', urlencodedParser, async (req, res) => {
        db.set('url', req.body.url)
            .set('user', req.body.user)
            .set('password', req.body.password)
            .write();

        let check = await Api.checkConnection();

        switch (check) {
            case true:
                await sync();
                res.send('<div style="text-align:center"><h2>Successfully connected!</h2></div>');
                process.exit(0);
                break;

            case false:
                res.send('<div style="text-align:center"><h2>Connection error! Please recheck</h2><br><a href="http://192:8080">Go back</a></div>');
                break;
        }
    });
}

(async () => {
    try {
        await addPrinters();
        await updatePrinters();

        // startUi();

        printImages();

        let minutes = 1;
        let interval = minutes * 60 * 1000;
        // setInterval(async () => {
        //     await updatePrinters();
        // }, interval);
    } catch (err) {
        // PM2 automatically this script restarts after that
        process.exit(0);
    }
})();

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(0);
  // application specific logging, throwing an error, or other logic here
});
