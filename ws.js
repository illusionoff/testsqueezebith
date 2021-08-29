const { wsStartBith } = require('./lib/bithumbpro');//coinConfigBith
// const { writtenCSV, testWritable, parseCSV, parseCSV2 } = require('./functions/functions');
// const { coinConfigBith } = require('./lib/bithOrderbook');

function init() {
  wsStartBith('subscribe', "ORDERBOOK10:XRP-USDT");
}

init();
