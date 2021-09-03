
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
  // if (initialObj.orderbookFirstPreviousBay && bay != initialObj.orderbookFirstPreviousBay) {
  console.log('function changeTradeArr() initialObj.orderbookFirstPreviousBay=', initialObj.orderbookFirstPreviousBay);
  console.log('function changeTradeArr() initialObj.bay=', bay);
  // process.exit();
  initialObj.time = new Date().getTime();
  let diffTimeServer = initialObj.time - initialObj.messageObj.timestamp;
  let diffTimeVer = initialObj.messageObj.timestamp - parseInt(initialObj.messageObj.data.ver, 10);

  bayOrSell = 1;
  initialObj.orderbookFirstPreviousBay = bay;
  console.log('bay=', bay);
  initialObj.orderbookFirstPreviousSell = sell;
  console.log('sell=', sell);
  const arrLengthBay = initialObj.arrChart.b.length + 1;
  initialObj.arrChart.b.push([arrLengthBay, bay, sell, initialObj.time, initialObj.messageObj.data.ver, diffTimeVer, initialObj.messageObj.timestamp, diffTimeServer]);//['b', bay, initialObj.timeBay]
  // initialObj.objArrs.arrTimeBay.push(initialObj.timeBay);

  // initialObj.priceAndComissionsBay = bay - bay * initialObj.takerComissions;//  bay=bids это покупатели, клиенты продают самая выгодня цена для клиентов самая высокая, комиссию отнимаем
  trueBay = true;
  // }
  // if (initialObj.orderbookFirstPreviousSell && sell != initialObj.orderbookFirstPreviousSell) {
  // Если одновременно изменения и в bay и в sell
  if (bayOrSell === 1) {
    bayOrSell = 2;
  } else {
    bayOrSell = 0;
  }
  // initialObj.orderbookFirstPreviousSell = sell;
  // console.log('sell=', sell);
  const arrLengthSell = initialObj.arrChart.b.length + 1;

  initialObj.arrChart.s.push([arrLengthSell, sell, initialObj.time, initialObj.messageObj.data.ver, diffTimeVer, initialObj.messageObj.timestamp, diffTimeServer]);//['s', sell, initialObj.timeSell]


  // initialObj.priceAndComissionsSell = sell + sell * initialObj.makerComissions; // sell=asks это продавцы, клиенты покупатели, самая выгодня цена для клиентов самая низкая, комиссию плюсуем
  trueSell = true;
  // }

  if (trueBay || trueSell) {
    initialObj.bayOrSell = bayOrSell;
    variableClosure2('2');
    return true
  }

  return false
}

// в arrB находим наибольшоую разницу в сторону возростания
function diffMaxIndex(obj, arrDiffMaxIndex) { // true = sell, false = bay
  let diffMax = obj.arr.reduce((accum, item, index, arr) => {
    let preIndex = 0;
    preIndex = index - 1;
    if (preIndex < 2) return accum
    if (arrDiffMaxIndex.includes(preIndex)) return accum
    let diff = item - arr[preIndex];
    if (obj.sell) diff = -diff;
    if (diff > accum.diff) {
      accum.diff = diff;
      accum.index = preIndex;
      return accum
    }
    return accum
  }, { diff: 0, index: 0 }); // Начальное значение аккумулятора 0
  return diffMax.index
}

function diffMaxIndexS(obj) {
  //obj = { arr: arr, sell: true }
  let arrDiffMaxIndex = [];

  for (let i = 0; i < 3; i++) {
    const resDiff = diffMaxIndex(obj, arrDiffMaxIndex);
    resDiff != 0 ? arrDiffMaxIndex.push(resDiff) : false
  }

  return arrDiffMaxIndex
}

module.exports = { changeTradeArr, reconnectTimeMessageClosure, diffMaxIndexS }
