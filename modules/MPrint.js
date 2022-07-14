const { spawn } = require('child_process')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const Printer = require('zuzel-printer');
const fs = require('fs');
const ip = require('ip');
const aloha = require('aloha-sd');
const isReachable = require('is-reachable');

function getPrinters() {
    let adapter = new FileSync('printers.json');
    let db = low(adapter);

    return db.get('printers');
}

async function getPrinterStatus(name, type) {
    switch (type) {
        case 'usb':
            return new Promise((resolve, reject) => {
                let lsusb = spawn('lsusb', ['-v']);

                let result = '';

                lsusb.stdout.on('data', (data) => {
                    result += data.toString();
                });

                lsusb.on('close', (code) => {
                    if (result.includes('Brother')) {
                        resolve('online');
                    } else {
                        resolve('offline');
                    }
                });
            });
            break;

        case 'dns':
            // Discover network printer
            return new Promise((resolve, reject) => {
                let wait = setTimeout(() => {
                    try {
                        finder.shutdown();
                    } catch (err) { }

                    resolve('offline');
                }, 10000);

                let finder = aloha.find((err, result) => {
                    if (result) {
                        if (result.name.includes(name) && result.ipv4[0] !== ip.address()) {
                            try {
                                finder.shutdown();
                            } catch (err) { }

                            let ip = result.ipv4[0];

                            isReachable(ip).then((reachable) => {
                                switch (reachable) {
                                    case true:
                                        clearTimeout(wait);
                                        resolve('online');
                                        break;

                                    case false:
                                        clearTimeout(wait);
                                        resolve('offline');
                                        break;
                                }
                            });
                        }
                    }
                }, '_ipp._tcp');
            });
            break;
    }
}

async function pngToBin(printer, pngPath) {
    return new Promise((resolve, reject) => {
        var binPath = pngPath + '.bin';

	    var printerName = printer.name

        // Create bin from png
        let python = spawn('/usr/bin/python3', ['/home/printserver/.local/bin/brother_ql_create', '--model', printerName, '--label-size', printer.size_mm, pngPath]);
        console.log(printer.name, printer.size_mm, pngPath);
        let binStream = fs.createWriteStream(binPath, { flags: 'a' });

        // Write the bin file
        python.stdout.pipe(binStream);

        python.stderr.on('data', (data) => 
		{
            resolve(false);
        });

        python.on('close', (code) => {
            resolve(binPath);
        });
    });
}

async function createIdLabel(printer) {
    let pngPath = '/tmp/' + getRandomString() + '.png';

    return new Promise((resolve, reject) => {
        let convert = spawn('convert', ['-size', printer.size_px, 'xc:white', '-pointsize', '120', '-fill', 'black', '-gravity', 'center', '-annotate', '+0+0', 'Printer ID: ' + printer.id, pngPath]);

        convert.stderr.on('data', (data) => {
            resolve(false);
        });

        convert.on('close', async (code) => {
            resolve(pngPath);
        });
    });
}

async function printIdLabel(printer) {
    let pngPath = await createIdLabel(printer);

    return print(printer, getRandomString(), pngPath);
}

function deleteFile(file) {
    fs.unlinkSync(file)
}

async function print(printer, jobName, pngPath) {
    return new Promise(async (resolve, reject) => {

        // let binPath = await pngToBin(printer, pngPath);
      

        // if(!binPath) {
        //     console.log("Invalid printer name " + printer.name)
        //     reject()
        // }

        var printerMachine = new Printer(printer.name);
        let fileBuffer = fs.readFileSync(pngPath);

    
        let options = {
            t: jobName
        };

        if(true) {
            printerMachine.destroy()
            resolve(true)
            return
        }

        var job = printerMachine.printBuffer(fileBuffer, options); //or without options

        var wait = setTimeout(() => {
            job.removeAllListeners();
            job.cancel();
            printerMachine.destroy();

            resolve(null);
        }, 15000);

        job.on('completed', function () {
            job.removeAllListeners();
            printerMachine.destroy();

            clearTimeout(wait);
            resolve(true);
        });

        job.on('error', function () {
            job.removeAllListeners();
            job.cancel();
            printerMachine.destroy();

            clearTimeout(wait);
            resolve(false);
        });
    });
}

function getRandomString() {
    return Math.random().toString(36).substring(2, 15);
}

// export the module
module.exports = {
    getPrinters: getPrinters,
    getPrinterStatus: getPrinterStatus,
    printIdLabel: printIdLabel,
    print: print,
    getRandomString: getRandomString
};
