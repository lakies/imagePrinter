const MPrint = require('./modules/MPrint');
const async = require('async');

let printers = MPrint.getPrinters();

async.each(printers.value(), async (printer) => {
    await MPrint.printIdLabel(printer);
});