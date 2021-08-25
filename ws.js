// const fs = require("fs");
// test server
const { wsGetGate, initialGate } = require('./lib/gate');
const { wsStartBith, initialBith, coinConfigBith } = require('./lib/bithumbpro');//coinConfigBith
const { writtenCSV, testWritable, parseCSV, parseCSV2 } = require('./functions/functions');
// const { coinConfigBith } = require('./lib/bithOrderbook');

function init() {
  wsStartBith('subscribe', "ORDERBOOK:XRP-USDT");
}

init();
