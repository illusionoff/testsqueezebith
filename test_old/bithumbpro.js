const fs = require("fs");
const { changeTradeArr, diffMaxIndexS, timeStopTestClosure, consoleLogGroup, squeeze, timerClosure, funStartPing, funEndPing, funStartReconnect, computes } = require('../functions/functions');
const config = require('config');

const ReconnectingWebSocket = require('reconnecting-websocket');
const WS = require('ws');

const TRACK_ELEMENT_ORDERBOOK = config.get('TRACK_ELEMENT_ORDERBOOK');
const ANALYSIS_PERIOD = config.get('ANALYSIS_PERIOD');
const TIMER_PING = config.get('TIMER_PING');
const VERSION = config.get('VERSION');

const TIMER_RECONNECT_MESSAGE = config.get('TIMER_RECONNECT_MESSAGE');

let countReconnect = -1;
let countErrors = 0;

let initialBith = {
  name: 'bith',
  initialWs: false,
  messageObj: {},
  orderbookFirstPreviousBuy: undefined,
  orderbookFirstPreviousSell: undefined,
  buy: undefined,
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
let timerWritting;

// function average(arr, strItem) {
//   const sum = arr.reduce((accum, item) => accum += item[strItem], arr[0][strItem]);
//   const average = sum / arr.length;
//   // const averageRound = average.round(1);//округляем
//   const averageRound = Math.round(average);
//   return averageRound
// }
// function computes(arr) {
//   const diffTimeVer = average(arr, 5);
//   const diffTimeServer = average(arr, 7);
//   console.log('computes(arr) diffTimeVer=', diffTimeVer);
//   console.log('computes(arr) diffTimeServer=', diffTimeServer);
//   return { diffTimeVer, diffTimeServer }
// }
// function startTimerWritting(arrChart) {
// clearInterval(timerWritting);
// timerWritting = setInterval(function () {
let funStartWritting = (arrChart) => {
  const timeNow = new Date().getTime();
  let result = squeeze(arrChart, 1);
  let result2 = squeeze(arrChart, 2);
  console.log('result=', result);
  console.log('result2=', result2);
  // для теста создания файла отчета result = true; config/default.json -> "ANALYSIS_PERIOD": 300000 поменять на 50000 "MIN_SQUEEZE_PERCENT": 0.015 поменять на -0.015
  result = true;
  if (result || result2) {
    let str = '';
    const arrBuy = arrChart.map((item) => item + '\n'); //"\r\n"
    str += arrBuy.join('');
    console.log('str=', str);
    let computesBuy = computes(arrChart);
    let arrTempBuy = arrChart.map((item) => item[1]);
    let arrTempSell = arrChart.map((item) => item[2]);
    const resDiffMaxIndexSell = diffMaxIndexS({ arr: arrTempSell, sell: true });
    const resDiffMaxIndexBuy = diffMaxIndexS({ arr: arrTempBuy, sell: false });
    const strComputes = `\n averag diffTimeVer = ${computesBuy.diffTimeVer} \n averag diffTimeServer = ${computesBuy.diffTimeServer}`;

    consoleLogGroup`arrTemp.arrTempSell.length = ${arrTempSell.length}
      arrTempSell = ${arrTempSell}
      arrTempBuy = ${arrTempBuy}
      diffMaxIndexS({ arr: arrTemp, sell: true }) = ${resDiffMaxIndexSell}
      diffMaxIndexS({ arr: arrTemp, sell: false }) = ${resDiffMaxIndexBuy}
      strComputes = ${strComputes}`;

    const resDiffMaxIndex = `\n resDiffMaxIndexSell = ${resDiffMaxIndexSell}\n resDiffMaxIndexBuy = ${resDiffMaxIndexBuy}`;
    str += strComputes + resDiffMaxIndex;
    fs.writeFile(`logs/${timeNow}_testQueezeBith.csv`, str, function (error) {
      if (error) throw error;
      console.log("Запись файла завершена.");
    });
  }
  // обнуляем массив
  arrChart.length = 0;
}
// }, ANALYSIS_PERIOD);
// }

// function stopTimerWritting() {
//   clearInterval(timerWritting);
//   console.log('stopTimerWritting');
// }

function wsStartBith(cmd, args) {
  const params = JSON.stringify({
    "cmd": cmd,
    "args": [args]
  });
  // вывод дополнительной информации, остановка программы по истечении времени TIME_STOP_TEST
  let timeStopTest = timeStopTestClosure();
  let timerConfigPing = {
    period: TIMER_PING, funStart: funStartPing, funEnd: funEndPing,
    funStartArguments: [ws], funEndArguments: []
  };

  let timerConfigReconnect = {
    period: TIMER_RECONNECT_MESSAGE, funStart: funStartReconnect,
    funStartArguments: [ws], warming: 1
  };

  let timerConfigWritting = {
    period: ANALYSIS_PERIOD, funStart: funStartWritting,
    funStartArguments: [initialBith.arrChart]
  };

  let timerPing = timerClosure(timerConfigPing);
  let timerReconnectMessages = timerClosure(timerConfigReconnect);
  let timerWritting = timerClosure(timerConfigWritting);

  ws.onopen = function () {
    console.log('open');
    console.log('countReconnect=', countReconnect);
    countReconnect++;
    ws.send(params);
    timerPing.start();
    // startTimerWritting(initialBith.arrChart);
    timerWritting.start();
  };
  ws.onmessage = function (message) {
    console.log('countReconnect=', countReconnect);
    console.log('countErrors=', countErrors);
    initialBith.messageObj = JSON.parse(message.data); //utf8Data  с сервера это строка преобразуем в объект

    if (initialBith.messageObj.error) {
      console.log('Reconnect error', console.messageObj.error);
      return ws.reconnect(1006, 'Reconnect error');
    }

    console.log('messageObj:', initialBith.messageObj);
    console.log(`code= ${initialBith.messageObj.code}, msg = ${initialBith.messageObj.msg} `);

    if (initialBith.messageObj.code && initialBith.messageObj.code === '0' &&
      initialBith.messageObj.msg && initialBith.messageObj.msg === 'Pong') {
      let timeNaw = new Date().getTime();
      console.log('!time Pong bith======================================', timeNaw);
    } else {
      // Не учитываем сообщения Pong
      timeStopTest({ countReconnect, countErrors, name: initialBith.name });
      timerReconnectMessages.start();// если превышено время между сообщениями
    }

    if (initialBith.messageObj.code === "00007") {
      consoleLogGroup`00007***************************************************
      00007 initialBith.messageObj.data = ${initialBith.messageObj.data}
      time Naw my = ${new Date().getTime()}
      initialBith.messageObj.timestamp = ${initialBith.messageObj.timestamp}
      Ver: ${VERSION}`;

      initialBith.buy = Number(initialBith.messageObj.data.b[TRACK_ELEMENT_ORDERBOOK][0]);
      initialBith.sell = Number(initialBith.messageObj.data.s[TRACK_ELEMENT_ORDERBOOK][0]);
      initialBith.initialWs = true;

      if (!Boolean(initialBith.orderbookFirstPreviousBuy)) initialBith.orderbookFirstPreviousBuy = initialBith.buy
      if (!Boolean(initialBith.orderbookFirstPreviousSell)) initialBith.orderbookFirstPreviousSell = initialBith.sell
      if (initialBith.orderbookFirstPreviousBuy && initialBith.orderbookFirstPreviousSell) {
        initialBith.globalFlag = true;
        console.log('initialBith.globalFlag = true');
      }

      if (initialBith.globalFlag && initialBith.initialWs) {
        if (changeTradeArr(initialBith)) console.log('changeTradeArr');
      }
    }
  }

  ws.onclose = function () {
    initialBith.initialWs = false;
    console.log('close');
    timerPing.stop();
    // stopTimerWritting();
    timerWritting.stop();
  };

  ws.onerror = function (err) {
    initialBith.initialWs = false;
    console.log('error', err);
    countErrors++;
    timerPing.stop();
    // stopTimerWritting();
    timerWritting.stop();
  };

};

module.exports = { wsStartBith }
// client.connect('wss://global-api.bithumb.pro/message/realtime');
