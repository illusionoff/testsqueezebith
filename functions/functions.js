
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
function changeTradeArr(initialObj) {
  console.log('initialObj.name=', initialObj.name);
  let bay = initialObj.bay;
  let sell = initialObj.sell;
  let trueBay = false;
  let trueSell = false;
  let bayOrSell = -1;
  // initialObj.bayOrSell = -1; // для исключения влияния предыдущего значения опроса
  variableClosure('1');//count= 0
  // выход при устаревании данных
  // if ()
  //  Инициализация первых предыдущих значений
  // проверка изменения значения для предотвращения лишних вычислений
  if (initialObj.orderbookFirstPreviousBay && bay != initialObj.orderbookFirstPreviousBay) {
    console.log('function changeTradeArr() initialObj.orderbookFirstPreviousBay=', initialObj.orderbookFirstPreviousBay);
    console.log('function changeTradeArr() initialObj.bay=', bay);
    // process.exit();

    bayOrSell = 1;
    initialObj.timeBay = new Date().getTime();
    initialObj.orderbookFirstPreviousBay = bay;
    console.log('bay=', bay);

    initialObj.objArrs.arrBay.push(bay);
    initialObj.objArrs.arrTimeBay.push(initialObj.timeBay);

    // initialObj.priceAndComissionsBay = bay - bay * initialObj.takerComissions;//  bay=bids это покупатели, клиенты продают самая выгодня цена для клиентов самая высокая, комиссию отнимаем
    trueBay = true;
  }
  if (initialObj.orderbookFirstPreviousSell && sell != initialObj.orderbookFirstPreviousSell) {
    // Если одновременно изменения и в bay и в sell
    if (bayOrSell === 1) {
      bayOrSell = 2;
    } else {
      bayOrSell = 0;
    }
    initialObj.timeSell = new Date().getTime();
    initialObj.orderbookFirstPreviousSell = sell;
    console.log('sell=', sell);

    initialObj.objArrs.arrSell.push(sell);
    initialObj.objArrs.arrTimeSell.push(initialObj.timeSell);

    // initialObj.priceAndComissionsSell = sell + sell * initialObj.makerComissions; // sell=asks это продавцы, клиенты покупатели, самая выгодня цена для клиентов самая низкая, комиссию плюсуем
    trueSell = true;
  }

  if (trueBay || trueSell) {
    initialObj.bayOrSell = bayOrSell;
    variableClosure2('2');
    return true
  }

  return false
}


module.exports = { changeTradeArr, reconnectTimeMessageClosure }
