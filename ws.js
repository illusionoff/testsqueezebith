const { wsStartBith } = require('./lib/bithumbpro');

wsStartBith('subscribe', "ORDERBOOK10:XRP-USDT");
