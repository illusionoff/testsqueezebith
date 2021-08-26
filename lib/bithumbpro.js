const fetch = require('node-fetch');
const fs = require("fs");
const { goTrade, reconnectTimeMessageClosure, changeTradeArr } = require('../functions/functions');
const config = require('config');

const ReconnectingWebSocket = require('reconnecting-websocket');
const WS = require('ws');
const { exit } = require('process');
// const WebSocket = require('ws');
// test

const TRACK_ELEMENT_ORDERBOOK = config.get('TRACK_ELEMENT_ORDERBOOK');

let countReconnectConsistenBOOK = 0;
let arrTimeOverCode0 = [];
const timeStart = new Date().getTime();
let timeAll = 0;

let timePrevious = 0;
let timeNaw = 0;
let colMessage = 0;
let maxTimePeriod = 0;


let countReconnect = -1;
let countReconnectCode0 = -1;
let countErrors = 0;


let initialBith = {
  name: 'bith',
  initialWs: false,
  initialFetchURL: false,
  messageObj: {},
  messageEdit: {},
  allOrderbookBay: [],
  allOrderbookSell: [],
  ver: 0,
  orderbookFirstPreviousBay: undefined,
  orderbookFirstPreviousSell: undefined,
  priceAndComissionsBay: 0,
  priceAndComissionsSell: 0,
  takerComissions: 0,
  makerComissions: 0,
  bay: undefined,
  sell: undefined,
  baySellTimestamp: undefined,
  bayOrSell: -1,
  bayQuantity: undefined,
  sellQuantity: undefined,
  status: 0,
  indexLeveragesOrderbookBay: [],
  indexLeveragesOrderbookSell: [],
  timeBay: undefined,
  timeSell: undefined,
  time: undefined,
  // objArrs: { arrBay: [], arrSell: [], arrTimeBay: [], arrTimeSell: [] }
  // objArrs: { arrBay: [], arrSell: [] }
  arrChart: []
}
let intervalId = 0;
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
const comma = 1;
// console.log(n.round(2));
// process.exit();
// const ws = new WebSocket(config.get('WS_URL_BITH'));

// {encoding: 'utf8', highWaterMark: 332 * 1024});// задать значение буфера

function indexOfTwoDimens(arr, value) {
  for (let i = 0; i < arr.length; i++) {
    // console.log(arr[i][0]);
    if (arr[i][0] === value) return i
  }
  return -1
}

function orderbookChange(allOrderbook, newMessage) {

  const index = indexOfTwoDimens(allOrderbook, newMessage[0][0]);
  if (index >= 0) {
    //   //  удалить из массива этот элемент
    if (newMessage[0][1] === '0.000000') return allOrderbook.splice(index, 1)
    // заменить новым значением
    return allOrderbook[index][1] = newMessage[0][1];
  }
  // Если элемент не найден, то добавить в массив и упорядочить по убыванию либо возроастнию
  allOrderbook.push(newMessage[0]);
  //Определяем это данные bay или sell. Если первый элемент allOrderbook больше последующих - убывающая последовательность то это bay иначе sell
  if (allOrderbook[0][0] > allOrderbook[5][0]) return allOrderbook.sort((a, b) => Number(b[0]) - Number(a[0]))
  allOrderbook.sort((a, b) => Number(a[0]) - Number(b[0]));
}

function changeFirstOrderbook(Orderbook, OrderbookNow) {
  // для тестов записи в файл  убираю функционал проверки изменения 10 -го элемента
  console.log('Orderbook=', Orderbook);
  console.log('OrderbookNow[0]=', OrderbookNow[0]);
  if (Orderbook[0] == OrderbookNow[0] && Orderbook[1] == OrderbookNow[1]) return false
  // Orderbook[0] = OrderbookNow[0];

  // Orderbook[0] = OrderbookNow[0];
  // Orderbook[1] = OrderbookNow[1];
  console.log('Orderbook 2=', Orderbook);
  return true
}

function wsStartBith(cmd, args, initialGate, writableFiles) {


  let testTimeArr = [];
  let tesTimeCount = 0;
  const params = JSON.stringify({
    "cmd": cmd,
    "args": [args]
  });
  let ping;

  function startPing(time) {
    ping = setInterval(function () {
      ws.send(JSON.stringify({ "cmd": "ping" }));
      let timeNaw = new Date().getTime();
      console.log('time ping bith======================================', timeNaw);
    }, time);
  }

  function stopPing() {
    clearInterval(ping);
  }

  let timerWritting;
  function startTimerWritting() {
    timerWritting = setInterval(function () {
      // //objArrs: { arrBay: [], arrSell: [], arrTimeBay: [], arrTimeSell: [] }
      // //let resultArr = 
      // //let strBay = initialBith.objArrs.arrBay.map((item) => item ); //"\r\n"
      // let strBay = initialBith.arrChart.join('\n');
      const timeNow = new Date().getTime();
      console.log('initialBith.arrChart=', initialBith.arrChart);
      // let b = a.reduce( (accum, item) => {
      //     accum.push(item.id);
      //     return accum;
      //   }, []); // Начальное значение аккумулятора пустой массив
      //   console.log('---------');
      // process.exit();
      // fs.writeFile(`logs/${timeNow}_testQueezeBith.txt`, strBay, function (error) {

      //   if (error) throw error; // если возникла ошибка
      //   console.log("Асинхронная запись файла завершена. Содержимое файла:");
      //   // let data = fs.readFileSync("hello.txt", "utf8");
      //   // console.log(data);  // выводим считанные данные
      // });
    }, 30_000);
  }

  function stopTimerWritting() {
    clearInterval(timerWritting);
  }

  let reconnectTimeMessage = reconnectTimeMessageClosure(ws);

  ws.onopen = function () {
    console.log('open');
    console.log('countReconnect=', countReconnect);
    console.log('countReconnectCode0=', countReconnectCode0);
    countReconnect++;
    ws.send(params);
    startPing(20000);
    startTimerWritting();
  };

  ws.onmessage = function (message) {
    console.log('BITHUMB message%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%');
    console.log('countReconnect=', countReconnect);
    console.log('countReconnectCode0=', countReconnectCode0);
    console.log('countReconnectConsistenBOOK=', countReconnectConsistenBOOK);
    console.log('countErrors=', countErrors);
    initialBith.messageObj = JSON.parse(message.data); //utf8Data  с сервера это строка преобразуем в объект
    if (initialBith.messageObj.error) {
      console.log('Reconnect error', console.messageObj.error);
      return ws.reconnect(1006, 'Reconnect error');
    }
    if (!initialBith.messageObj.msg && initialBith.messageObj.code && initialBith.messageObj.code === '0') {
      console.log('!Reconnect code 0');
      countReconnectCode0++;
      return ws.reconnect(1006, 'initialBith.messageObj.code === 0');
    }

    console.log('onmessage Gate initialBith.messageObj.timestamp=', initialBith.messageObj.timestamp);
    console.log('initialBith.messageObj:SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS', initialBith.messageObj);
    console.log(`code= ${initialBith.messageObj.code}, msg = ${initialBith.messageObj.msg} `);

    if (initialBith.messageObj.code && initialBith.messageObj.code === '0' &&
      initialBith.messageObj.msg && initialBith.messageObj.msg === 'Pong') {
      console.log('!Pong1');
      // process.exit();
    } else {
      // Не учитываем сообщения Pong
      timeNaw = new Date().getTime();
      console.log('timeNaw=', timeNaw);
      console.log('timeStart=', timeStart);
      colMessage++;
      console.log('colMessage======================================================', colMessage);

      let varPeriod = timeNaw - timePrevious;
      if (colMessage > 20 && varPeriod > maxTimePeriod) { maxTimePeriod = varPeriod }
      timeAll = Math.round((timeNaw - timeStart) / 1000);
      let viewMAxTimePeriod = Math.round((maxTimePeriod) / 1000);
      console.log(` BITHUMB viewMAxTimePeriod=${viewMAxTimePeriod}, colMessage=${colMessage}, timeNaw=${timeNaw}, time All=${timeAll}`);
      timePrevious = timeNaw;
      if (timeAll > 300) {
        // // тест
        // console.log('initialBith.allOrderbookBay');
        // for (let i = 0; i < 10; i++) {
        //   console.log(`allOrderbookBay[${i}]= ${initialBith.allOrderbookBay[i]}`);
        // }
        // console.log('initialBith.allOrderbookSell');
        // for (let i = 0; i < 10; i++) {
        //   console.log(`allOrderbookBay[${i}]= ${initialBith.allOrderbookSell[i]}`);
        // }
        console.log('|Time OUT 5 min test');
        // process.exit();
      }
      reconnectTimeMessage(); // если превышено время между сообщениями
    }

    if (initialBith.messageObj.code === "00006") {
      initialBith.ver = Number(initialBith.messageObj.data.ver);
      initialBith.allOrderbookBay = initialBith.messageObj.data.b.slice();
      initialBith.allOrderbookSell = initialBith.messageObj.data.s.slice();
      //замена функционала на аналогичное как у Gate
      // orderbookFirstPreviousBay = allOrderbookBay[TRACK_ELEMENT_ORDERBOOK].slice();
      // orderbookFirstPreviousSell = allOrderbookBay[TRACK_ELEMENT_ORDERBOOK].slice();
      console.log('initialBith.messageObj.data.b.length=', initialBith.messageObj.data.b.length);
      console.log('initialBith.messageObj.data.s.length=', initialBith.messageObj.data.s.length);

    }

    if (initialBith.messageObj.code === "00007") {
      console.log('00007***************************************************');
      console.log('time Naw my=', new Date().getTime());
      console.log('initialBith.messageObj.timestamp=', initialBith.messageObj.timestamp);
      testTimeArr.push([new Date().getTime(), initialBith.messageObj.timestamp]);
      tesTimeCount++;
      if (tesTimeCount === 20) {
        console.log('Test Time Bith');
        console.log('testTimeArr=', testTimeArr);
        let arrTimeTest = testTimeArr.map((elem) => {
          return Math.round((elem[0] - elem[1]));
        });
        console.log('arrTimeTest разница=', arrTimeTest);
        // process.exit();
      }
      console.log('arrTimeOverCode0', arrTimeOverCode0);
      if (Number(initialBith.messageObj.data.ver) === initialBith.ver + 1) {
        initialBith.ver++;
        console.log('_____________________________________________________________TRUE');
        console.log('Было***************************************************Bay');
        // for (let i = 0; i < 10; i++) {
        //   console.log(allOrderbookBay[i]);
        //   // console.log(allOrderbookSell[i]);
        // }
        console.log('initialBith.allOrderbookBay[TRACK_ELEMENT_ORDERBOOK]=', initialBith.allOrderbookBay[TRACK_ELEMENT_ORDERBOOK]);

        console.log('Было***************************************************Sell');
        // for (let i = 0; i < 10; i++) {
        //   console.log(allOrderbookSell[i]);
        //   // console.log(allOrderbookSell[i]);
        // }
        console.log('initialBith.allOrderbookSell[TRACK_ELEMENT_ORDERBOOK]=', initialBith.allOrderbookSell[TRACK_ELEMENT_ORDERBOOK]);

        console.log('initialBith.messageObj.data.b:', initialBith.messageObj.data.b);//для отладки себе включить
        console.log('initialBith.messageObj.data.s:', initialBith.messageObj.data.s);//для отладки себе включить

        if (initialBith.messageObj.data.b.length === 1) orderbookChange(initialBith.allOrderbookBay, initialBith.messageObj.data.b);
        if (initialBith.messageObj.data.s.length === 1) orderbookChange(initialBith.allOrderbookSell, initialBith.messageObj.data.s);

        console.log('initialBith.allOrderbookBay.length=((((((((((((((((((((((((((((((((((', initialBith.allOrderbookBay.length);
        console.log('initialBith.allOrderbookSell.length=((((((((((((((((((((((((((((((((((', initialBith.allOrderbookSell.length);
        console.log('Стало***************************************************Bay');
        // for (let i = 0; i < 10; i++) {
        //   console.log(allOrderbookBay[i]);
        //   // console.log(allOrderbookSell[i]);
        // }
        console.log('initialBith.allOrderbookBay[TRACK_ELEMENT_ORDERBOOK]=', initialBith.allOrderbookBay[TRACK_ELEMENT_ORDERBOOK]);

        console.log('Стало***************************************************Sell');
        // for (let i = 0; i < 10; i++) {
        //   console.log(allOrderbookSell[i]);
        //   // console.log(allOrderbookSell[i]);
        // }
        console.log('initialBith.allOrderbookSell[TRACK_ELEMENT_ORDERBOOK]=', initialBith.allOrderbookSell[TRACK_ELEMENT_ORDERBOOK]);

        initialBith.bay = Number(initialBith.allOrderbookBay[TRACK_ELEMENT_ORDERBOOK][0]);
        initialBith.sell = Number(initialBith.allOrderbookSell[TRACK_ELEMENT_ORDERBOOK][0]);
        if (!Boolean(initialBith.orderbookFirstPreviousBay)) {
          initialBith.orderbookFirstPreviousBay = initialBith.bay;
        }
        if (!Boolean(initialBith.orderbookFirstPreviousSell)) {
          initialBith.orderbookFirstPreviousSell = initialBith.sell;
        }
        if (initialBith.orderbookFirstPreviousBay && initialBith.orderbookFirstPreviousSell) {
          initialBith.globalFlag = true;
          console.log('initialBith.globalFlag = true');
          // process.exit();
        }
        // if ((resultChangeOrderbookBay || resultChangeOrderbookSell) && initialBith.initialFetchURL) {
        initialBith.initialWs = true;
        // initialGate.globalFlag = true;

        console.log('bithumbpro.js initialBith.orderbookFirstPreviousBay=', initialBith.orderbookFirstPreviousBay);
        console.log('bithumbpro.js initialBith.bay=', initialBith.bay);
        console.log('It`s Bith');

        if (initialBith.globalFlag && initialBith.initialWs) {
          initialBith.time = initialBith.messageObj.timestamp;
          console.log('  initialBith.time=', initialBith.time);
          // objArrs: { arrBay: [], arrSell: [], arrTimeBay: [], arrTimeSell: [] }
          console.log('initialBith.arrChart=', initialBith.arrChart);


          if (changeTradeArr(initialBith)) {
            console.log('changeTradeArr');
            // process.exit();

            //   const paramsGoTrade = {
            //     bayGate: initialGate.priceAndComissionsBay,
            //     bayBith: initialBith.priceAndComissionsBay,
            //     sellGate: initialGate.priceAndComissionsSell,
            //     sellBith: initialBith.priceAndComissionsSell,
            //     timeServer: new Date().getTime(),
            //     timeBith: initialBith.time,
            //     timeGate: initialGate.time,
            //     timeGateSell: initialGate.timeSell,
            //     timeGateBay: initialGate.timeBay,
            //     timeBithSell: initialBith.timeSell,
            //     timeBithBay: initialBith.timeBay,
            //     bayOrSellGate: initialGate.bayOrSell,
            //     bayOrSellBith: initialBith.bayOrSell,
            //     init: 0
            //   }
            //   return goTrade(paramsGoTrade, writableFiles);
          }
        }

        // if (changeFirstOrderbook(orderbookFirstPreviousSell, allOrderbookSell)) {
        //   initialBith.sell = Number(allOrderbookSell[0][0]);
        //   initialBith.sellQuantity = Number(allOrderbookSell[0][1]);
        //   initialBith.priceAndComissionsSell = initialBith.sell + initialBith.sell * initialBith.takerComissions;
        //   console.log('Data first element ORDERBOOK changes Sell');
        //   // process.exit();
        // }
      } else {
        countReconnectConsistenBOOK++;
        console.log('countReconnectConsistenBOOK=', countReconnectConsistenBOOK);
        return ws.reconnect(1006, 'initialBith.ver not matches')
      }
    }
  };

  ws.onclose = function () {
    initialBith.initialWs = false;
    console.log('close');
    stopPing();
    stopTimerWritting();
    // ws.onopen();
  };

  ws.onerror = function (err) {
    initialBith.initialWs = false;
    console.log('error', err);
    countErrors++;
    stopPing();
    stopTimerWritting();
  };
}

// connection.send(JSON.stringify({ "cmd": "subscribe", "args": ["ORDERBOOK10:XRP-USDT"] }));

// wsStartBith('subscribe', "ORDERBOOK10:XRP-USDT");



module.exports = { wsStartBith }
// client.connect('wss://global-api.bithumb.pro/message/realtime');