const fs = require("fs");
const { reconnectTimeMessageClosure, changeTradeArr, diffMaxIndexS } = require('../functions/functions');
const config = require('config');

const ReconnectingWebSocket = require('reconnecting-websocket');
const WS = require('ws');

const TRACK_ELEMENT_ORDERBOOK = config.get('TRACK_ELEMENT_ORDERBOOK');
const ANALYSIS_PERIOD = config.get('ANALYSIS_PERIOD');
const TIMER_PING = config.get('TIMER_PING');
const TIME_STOP_TEST = config.get('TIME_STOP_TEST');

let countReconnect = -1;
let countReconnectCode0 = -1;
let countErrors = 0;

let initialBith = {
  initialWs: false,
  messageObj: {},
  orderbookFirstPreviousBay: undefined,
  orderbookFirstPreviousSell: undefined,
  bay: undefined,
  sell: undefined,
  arrChart: []
}

const options = {
  WebSocket: WS, // custom WebSocket constructor
  connectionTimeout: 5000,
  // maxRetries: 100, // default infinity
};
const ws = new ReconnectingWebSocket(config.get('WS_URL_BITH'), [], options);
// функция округления
Number.prototype.round = function (places) {
  return +(Math.round(this + "e+" + places) + "e-" + places);
}
// var n = 1.7777;
// n.round(2); // 1.78 .round(comma)
// {encoding: 'utf8', highWaterMark: 332 * 1024});// задать значение буфера
let ping;
function startPing(time) {
  stopPing()
  ping = setInterval(function () {
    ws.send(JSON.stringify({ "cmd": "ping" }));
    let timeNaw = new Date().getTime();
    console.log('time ping bith======================================', timeNaw);
  }, time);
}

function stopPing() {
  clearInterval(ping);
  console.log('stopPing');
  let timeNaw = new Date().getTime();
  console.log('time pong bith======================================', timeNaw);
}
// вывод дополнительной информации о остановка программы по истечении времени TIME_STOP_TEST
function closureTimeStopTest() {
  let colMessage = 0;
  let maxTimePeriod = 0;
  let timeAll = 0;
  let timePrevious = 0;
  const timeStart = new Date().getTime();
  function main() {
    let timeNaw = new Date().getTime();
    console.log('timeNaw=', timeNaw);
    console.log('timeStart=', timeStart);
    colMessage++;
    console.log('colMessage======================================================', colMessage);

    let varPeriod = timeNaw - timePrevious;
    if (colMessage > 20 && varPeriod > maxTimePeriod) { maxTimePeriod = varPeriod }
    timeAll = Math.round((timeNaw - timeStart) / 1000);// переводим микросекунды в секунды
    let viewMAxTimePeriod = Math.round((maxTimePeriod) / 1000);
    console.log(` BITHUMB viewMAxTimePeriod=${viewMAxTimePeriod}, colMessage=${colMessage}, timeNaw=${timeNaw}, time All=${timeAll}`);
    timePrevious = timeNaw;
    if (timeAll > TIME_STOP_TEST) {
      console.log('TEST_ORDERBOOB10=');
      console.log('initialBith.arrChart.length=', initialBith.arrChart.length);
      console.log('countReconnect=', countReconnect);
      console.log('countReconnectCode0=', countReconnectCode0);
      console.log('countErrors=', countErrors);
      console.log('|Time OUT 5 min test');
      // process.exit();
    }
  }
  return () => main()
}

function wsStartBith(cmd, args) {
  const params = JSON.stringify({
    "cmd": cmd,
    "args": [args]
  });

  function Squeeze(arr, strItem) {
    console.log('initialBith.arrChart=', initialBith.arrChart);
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
    console.log('((max - min) / averageRound)=', (max - min) / averageRound);
    let flag = (max - min) / averageRound > config.get('MIN_SQUEEZE_PERCENT') ? true : false;
    console.log('sum=', sum);
    console.log('average=', average);
    console.log('averageRound=', averageRound);
    console.log('max=', max);
    console.log('min=', min);
    console.log('flag=', flag);
    return flag
  }
  function average(arr, strItem) {
    const sum = arr.reduce((accum, item) => accum += item[strItem], arr[0][strItem]);
    const average = sum / arr.length;
    // const averageRound = average.round(1);//округляем
    const averageRound = Math.round(average);
    return averageRound
  }
  let timerWritting;
  function startTimerWritting() {
    clearInterval(timerWritting);
    timerWritting = setInterval(function () {
      const timeNow = new Date().getTime();
      let arrChart = initialBith.arrChart
      let result = Squeeze(arrChart, 1);
      let result2 = Squeeze(arrChart, 2);
      console.log('result=', result);
      console.log('result2=', result2);
      // для теста  result = true;
      // result = true;
      if (result || result2) {
        let str = '';
        const arrBay = arrChart.map((item) => item + '\n'); //"\r\n"
        str += arrBay.join('');
        console.log('str=', str);
        function computes(arr) {
          const diffTimeVer = average(arr, 5);
          const diffTimeServer = average(arr, 7);
          console.log('computes(arr) diffTimeVer=', diffTimeVer);
          console.log('computes(arr) diffTimeServer=', diffTimeServer);
          return { diffTimeVer, diffTimeServer }
        }

        let computesBay = computes(arrChart);
        let arrTempBay = arrChart.map((item) => item[1]);
        let arrTempSell = arrChart.map((item) => item[2]);

        console.log('arrTemp.arrTempSell=', arrTempSell.length);
        console.log('arrTempSell=', arrTempSell);
        console.log('arrTempBay=', arrTempBay);
        const resDiffMaxIndexSell = diffMaxIndexS({ arr: arrTempSell, sell: true });
        const resDiffMaxIndexBay = diffMaxIndexS({ arr: arrTempBay, sell: false });
        console.log('diffMaxIndexS({ arr: arrTemp, sell: true })=', resDiffMaxIndexSell);
        console.log('diffMaxIndexS({ arr: arrTemp, sell: false })=', resDiffMaxIndexBay);

        const strComputes = `\n averag diffTimeVer = ${computesBay.diffTimeVer} \n averag diffTimeServer = ${computesBay.diffTimeServer}`
        console.log('strComputes=', strComputes);
        const resDiffMaxIndex = `\n resDiffMaxIndexSell = ${resDiffMaxIndexSell}\n resDiffMaxIndexBay = ${resDiffMaxIndexBay}`;
        str += strComputes + resDiffMaxIndex;
        fs.writeFile(`logs/${timeNow}_testQueezeBith.csv`, str, function (error) {
          if (error) throw error;
          console.log("Запись файла завершена.");
        });
      }
      // обнуляем массив
      arrChart.length = 0;
    }, ANALYSIS_PERIOD);
  }

  function stopTimerWritting() {
    clearInterval(timerWritting);
    console.log('stopTimerWritting');
  }

  let timeStopTest = closureTimeStopTest();
  let reconnectTimeMessage = reconnectTimeMessageClosure(ws);

  ws.onopen = function () {
    console.log('open');
    console.log('countReconnect=', countReconnect);
    console.log('countReconnectCode0=', countReconnectCode0);
    countReconnect++;
    ws.send(params);
    startPing(TIMER_PING);
    startTimerWritting();
  };

  ws.onmessage = function (message) {
    console.log('countReconnect=', countReconnect);
    console.log('countReconnectCode0=', countReconnectCode0);
    console.log('countErrors=', countErrors);
    initialBith.messageObj = JSON.parse(message.data); //utf8Data  с сервера это строка преобразуем в объект
    if (initialBith.messageObj.error) {
      console.log('Reconnect error', console.messageObj.error);
      return ws.reconnect(1006, 'Reconnect error');
    }
    if (!initialBith.messageObj.msg && initialBith.messageObj.code && initialBith.messageObj.code === '0') {
      console.log('!Reconnect code 0');
      countReconnectCode0++;
      return ws.reconnect(1006, 'messageObj.code === 0');
    }

    console.log('messageObj:SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS', initialBith.messageObj);
    console.log(`code= ${initialBith.messageObj.code}, msg = ${initialBith.messageObj.msg} `);

    if (initialBith.messageObj.code && initialBith.messageObj.code === '0' &&
      initialBith.messageObj.msg && initialBith.messageObj.msg === 'Pong') {
      let timeNaw = new Date().getTime();
      console.log('!time Pong bith======================================', timeNaw);
    } else {
      // Не учитываем сообщения Pong
      timeStopTest();
      reconnectTimeMessage(); // если превышено время между сообщениями
    }


    if (initialBith.messageObj.code === "00007") {
      console.log('00007***************************************************');
      console.log('00007 initialBith.messageObj.data=', initialBith.messageObj.data);
      console.log('time Naw my=', new Date().getTime());
      console.log('initialBith.messageObj.timestamp=', initialBith.messageObj.timestamp);
      initialBith.bay = Number(initialBith.messageObj.data.b[TRACK_ELEMENT_ORDERBOOK][0]);
      initialBith.sell = Number(initialBith.messageObj.data.s[TRACK_ELEMENT_ORDERBOOK][0]);
      initialBith.initialWs = true;

      if (!Boolean(initialBith.orderbookFirstPreviousBay)) {
        initialBith.orderbookFirstPreviousBay = initialBith.bay;
      }
      if (!Boolean(initialBith.orderbookFirstPreviousSell)) {
        initialBith.orderbookFirstPreviousSell = initialBith.sell;
      }
      if (initialBith.orderbookFirstPreviousBay && initialBith.orderbookFirstPreviousSell) {
        initialBith.globalFlag = true;
        console.log('initialBith.globalFlag = true');
      }

      if (initialBith.globalFlag && initialBith.initialWs) {
        if (changeTradeArr(initialBith)) {
          console.log('changeTradeArr');
        }
      }
    }
  }

  ws.onclose = function () {
    initialBith.initialWs = false;
    console.log('close');
    stopPing();
    stopTimerWritting();
  };

  ws.onerror = function (err) {
    initialBith.initialWs = false;
    console.log('error', err);
    countErrors++;
    stopPing();
    stopTimerWritting();
  };

};

module.exports = { wsStartBith }
// client.connect('wss://global-api.bithumb.pro/message/realtime');
