
const config = require('config');
const MIN_PROFIT = config.get('MIN_PROFIT');
const TIME_DEPRECAT = config.get('TIME_DEPRECAT');
const TIME_DEPRECAT_ALL = config.get('TIME_DEPRECAT');
const fs = require("fs");

function Writable(data) {

}

function closure(name) {
  let count = 0;
  function main(name) {
    console.log(`${name} count=`, count);
    count++;
  }
  return (name) => main(name)
}

let variableClosure = closure();
let variableClosure2 = closure();



function reconnectTimeMessageClosure(ws) {
  let count = 0;// для разогрева - т.е не сразу начинать
  let timeoutHandle;
  let flag = false;

  function start() {
    timeoutHandle = setTimeout(function () {
      console.log('Reconnect setTimeout messages');
      count = 0;
      return ws.reconnect(1006, 'Reconnect error');
    }, 20000);
  }

  function stop() {
    clearTimeout(timeoutHandle);
  }

  function startReconnect() {
    count++;
    console.log('function  count=', count);
    if (count > 1) {
      if (!flag) {
        flag = true;
        start();
        console.log('start time');
      }
      stop();
      start();
    }
  }
  return (ws) => startReconnect(ws)
}



module.exports = { goTrade, writtenCSV, testWritable, parseCSV, parseTest, changeTradeArr, reconnectTimeMessageClosure }
