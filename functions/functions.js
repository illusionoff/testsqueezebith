const config = require('config');
const TIMER_RECONNECT_MESSAGE = config.get('TIMER_RECONNECT_MESSAGE');

function reconnectTimeMessageClosure(ws) {
  let count = 0;// для разогрева - т.е не сразу начинать
  let timeoutHandle;

  function start() {
    timeoutHandle = setTimeout(function () {
      console.log('Reconnect setTimeout messages');
      count = 0;
      return ws.reconnect(1006, 'Reconnect error');
    }, TIMER_RECONNECT_MESSAGE);
  }

  function stop() {
    clearTimeout(timeoutHandle);
  }

  function startReconnect() {
    count++;
    console.log('function  count=', count);
    if (count > 1) { // действие reconnect только после второго запуска функции
      console.log('start time');
      stop();
      start();
    }
  }
  return (ws) => startReconnect(ws)
}
function changeTradeArr(initialObj) {
  let bay = initialObj.bay;
  let sell = initialObj.sell;
  // выход при устаревании данных
  //  Инициализация первых предыдущих значений
  // проверка изменения значения для предотвращения лишних вычислений
  console.log('function changeTradeArr() initialObj.orderbookFirstPreviousBay=', initialObj.orderbookFirstPreviousBay);
  console.log('function changeTradeArr() initialObj.bay=', bay);
  initialObj.time = new Date().getTime();
  let diffTimeServer = initialObj.time - initialObj.messageObj.timestamp;
  let diffTimeVer = initialObj.messageObj.timestamp - parseInt(initialObj.messageObj.data.ver, 10);

  initialObj.orderbookFirstPreviousBay = bay;
  console.log('bay=', bay);
  initialObj.orderbookFirstPreviousSell = sell;
  console.log('sell=', sell);
  const arrLengthBay = initialObj.arrChart.length;
  initialObj.arrChart.push([arrLengthBay, bay, sell, initialObj.time, initialObj.messageObj.data.ver, diffTimeVer, initialObj.messageObj.timestamp, diffTimeServer]);
  return true
}

//  находим наибольшоую разницу
function diffMaxIndex(obj, arrDiffMaxIndex) { // true = sell, false = bay
  let diffMax = obj.arr.reduce((accum, item, index, arr) => {
    let preIndex = 0;
    preIndex = index - 1;
    if (preIndex < 2) return accum
    if (arrDiffMaxIndex.includes(preIndex)) return accum
    let diff = item - arr[preIndex];
    if (obj.sell) diff = -diff;// вариант для sell = false
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

  for (let i = 0; i < 5; i++) {// выводим 5 самых больших отклонений
    const resDiff = diffMaxIndex(obj, arrDiffMaxIndex);
    resDiff != 0 ? arrDiffMaxIndex.push(resDiff) : false
  }

  return arrDiffMaxIndex
}

module.exports = { changeTradeArr, reconnectTimeMessageClosure, diffMaxIndexS }
