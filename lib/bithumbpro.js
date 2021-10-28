const config = require('config');
const ReconnectingWebSocket = require('reconnecting-websocket');
const WS = require('ws');

const TRACK_ELEMENT_ORDERBOOK = config.get('TRACK_ELEMENT_ORDERBOOK');
const ANALYSIS_PERIOD = config.get('ANALYSIS_PERIOD');
const TIMER_PING = config.get('TIMER_PING');
const VERSION = config.get('VERSION');
const TIMER_RECONNECT_MESSAGE = config.get('TIMER_RECONNECT_MESSAGE');

const { changeTradeArr, timeStopTestClosure, timerClosure, funStartPing, funEndPing, funStartReconnect, funStartWritting, consoleLogGroup } = require('../functions/functions');

let countReconnect = -1;
let countErrors = 0;

let initialBith = {
  name: 'bith',
  initialWs: false,
  messageObj: {},
  orderbookFirstPreviousBay: undefined,
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
    funStartArguments: [initialBith.arrChart],
  };
  // периодическая отправка ping
  let timerPing = timerClosure(timerConfigPing);
  //если превышено время между сообщениями то реконнект
  let timerReconnectMessages = timerClosure(timerConfigReconnect);
  let timerWritting = timerClosure(timerConfigWritting);

  ws.onopen = function () {
    console.log('open');
    console.log('countReconnect=', countReconnect);
    countReconnect++;
    ws.send(params);
    timerPing.start();

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

      if (!Boolean(initialBith.orderbookFirstPreviousBay)) initialBith.orderbookFirstPreviousBay = initialBith.buy
      if (!Boolean(initialBith.orderbookFirstPreviousSell)) initialBith.orderbookFirstPreviousSell = initialBith.sell
      if (initialBith.orderbookFirstPreviousBay && initialBith.orderbookFirstPreviousSell) {
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
    timerWritting.stop();
  };

  ws.onerror = function (err) {
    initialBith.initialWs = false;
    console.log('error', err);
    countErrors++;
    timerPing.stop();
    timerWritting.stop();
  };

};

module.exports = { wsStartBith }
// client.connect('wss://global-api.bithumb.pro/message/realtime');
