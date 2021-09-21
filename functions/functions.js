const util = require('util');

const config = require('config');
const TIMER_RECONNECT_MESSAGE = config.get('TIMER_RECONNECT_MESSAGE');
const TIME_STOP_TEST = config.get('TIME_STOP_TEST');
const VERSION = config.get('VERSION');

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
  initialObj.time = new Date().getTime();
  let diffTimeServer = initialObj.time - initialObj.messageObj.timestamp;
  let diffTimeVer = initialObj.messageObj.timestamp - parseInt(initialObj.messageObj.data.ver, 10);
  initialObj.orderbookFirstPreviousBay = bay;
  initialObj.orderbookFirstPreviousSell = sell;
  consoleLogGroup`changeTradeArr() initialObj.orderbookFirstPreviousBay = ${initialObj.orderbookFirstPreviousBay}
  sell = ${sell}
  bay= ${bay}`;
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
function timeStopTestClosure() {
  let colMessage = 0;
  let maxTimePeriod = 0;
  let timeAll = 0;
  let timePrevious = 0;
  const timeStart = new Date().getTime();

  function main(obj) {//{countReconnect, countErrors,name:initialBith.name}
    let timeNaw = new Date().getTime();
    colMessage++;
    let varPeriod = timeNaw - timePrevious;
    if (colMessage > 20 && varPeriod > maxTimePeriod) { maxTimePeriod = varPeriod }
    timeAll = Math.round((timeNaw - timeStart) / 1000);// переводим микросекунды в секунды
    let viewMAxTimePeriod = Math.round((maxTimePeriod) / 1000);

    consoleLogGroup`timeNaw= ${timeNaw}
    timeStart=${timeStart}
    colMessage=${colMessage}
    ${obj.name}, Ver: ${VERSION}  viewMAxTimePeriod=${viewMAxTimePeriod}, colMessage=${colMessage}, timeNaw=${timeNaw}, time All=${timeAll}`;

    timePrevious = timeNaw;
    if (timeAll > TIME_STOP_TEST) {
      consoleLogGroup`countReconnect = ${obj.countReconnect}
      countErrors = ${obj.countErrors}
      |Time OUT sec stop = ${TIME_STOP_TEST}`;
    }
  }
  return (obj) => main(obj)
}
function consoleLogGroup(strings, ...expressions) {
  const inspectOptions = { showHidden: false, colors: true, depth: null }// depth: null глубокий вывод. compact: true минимизация количества строк
  let strOut = '';
  function trim(str) { return str.split('\n').map((item) => item.trim()).join('\n') }//удаляем лишние пробелы для устранения эффекта форматирования шаблонных строк VSCode.
  expressions.forEach((value, i) => {
    if (i === expressions.length - 1) {
      strOut += ' ' + trim(strings[i]) +
        util.formatWithOptions(inspectOptions, value) + ' ' +
        trim(strings[strings.length - 1]);
    }// Добавляем последний строковой литерал
    else strOut += ' ' + trim(strings[i]) + ' ' + util.formatWithOptions(inspectOptions, value);
  })
  // console.log(util.formatWithOptions({ showHidden: false, colors: true }, expressions[3]));// depth: null глубокий вывод
  // console.log(util.inspect(expressions[3], { showHidden: false, colors: true }))// depth: null глубокий вывод объектов и цветом
  console.log(strOut);
}

function squeeze(arr, strItem) {
  //  если данных нет или мало
  if (arr.length < 2) return false
  let arrTemp = arr.map((item) => item[strItem]);// цена это второй элемент сейчас в массиве для bay и третий для sell
  let sum = arrTemp.reduce((accum, item) => {
    accum += item;
    return accum;
  });
  let average = sum / arrTemp.length;
  let averageRound = average.round(8);//округляем
  let max = Math.max(...arrTemp);
  let min = Math.min(...arrTemp);
  // отклонение max - min от среднего
  let flag = (max - min) / averageRound > config.get('MIN_SQUEEZE_PERCENT') ? true : false;

  consoleLogGroup`((max - min) / averageRound)= ${(max - min) / averageRound}
  sum = ${ sum}
  average = ${average}
  averageRound= ${averageRound}
  max = ${max}
  min = ${min}
  flag = ${flag}`;
  return flag
}
module.exports = { changeTradeArr, reconnectTimeMessageClosure, diffMaxIndexS, timeStopTestClosure, consoleLogGroup, squeeze }
