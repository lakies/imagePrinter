const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const MPrint = require('./MPrint');
const urlParser = require('url');
var Client = require('node-rest-client').Client;

const updateMailbowPrinters = async () => {
    return new Promise((resolve, reject) => {
        let adapter = new FileSync('mb_config.json')
        let db = low(adapter)

        let url = db.get('url').value() + '/v3/printers';
        let user = db.get('user').value();
        let password = db.get('password').value();

        let client = new Client({ user: user, password: password });

        let printers = MPrint.getPrinters().value();

        let args = {
            data: printers,
            headers: { "Content-Type": "application/json" }
        };

        client.post(url, args, (data, response) => {
            resolve();
        });
    });
}

const checkConnection = async () => {
    return new Promise((resolve, reject) => {
        let adapter = new FileSync('mb_config.json')
        let db = low(adapter)

        let url = db.get('url').value() + '/v3/printers';
        let user = db.get('user').value();
        let password = db.get('password').value();

        let client = new Client({ user: user, password: password });

        client.get(url, (data, response) => {
            console.log(response.statusCode);
            if (response.statusCode === 200) {
                resolve(true);
            }

            resolve(false);
        });
    });
}

const getMbHost = () => {
    let adapter = new FileSync('mb_config.json')
    let db = low(adapter)
    
    let url = db.get('url').value() + '/v3/printers';
    let urlParsed = urlParser.parse(url);
    return urlParsed.host;
}

const getSocketUrl = async () => {
    return new Promise((resolve, reject) => {
        let host = getMbHost();

        let client = new Client();

        client.get('https://panel.mailbow.net/api/v1/serverinfo/' + host, (data, response) => {
            let socketUrl = 'https://' + data.server + '.postbureau.eu:8842';
            resolve(socketUrl);
        });
    });
}

// export the module
module.exports = {
    updateMailbowPrinters: updateMailbowPrinters,
    checkConnection: checkConnection,
    getMbHost: getMbHost,
    getSocketUrl: getSocketUrl
};
