
const config = require('config');
const TIME_STOP_TEST = config.get('TIME_STOP_TEST');
const VERSION = config.get('VERSION');

const { changeTradeArr } = require('./separate/changeTradeArr');
const { funStartWritting } = require('./separate/funStartWritting');
const { consoleLogGroup } = require('./separate/consoleLogGroup');

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


// let timerClosure = function (timerConfigObj) {
let timerClosure = function ({
  period, // number
  // funStart = function () { console.log('null function funStart') },
  // funEnd = function () { console.log('null function funEnd') },
  funStart, // function
  funEnd,  // function
  funStartArguments = [],
  funEndArguments = [],
  warming = 0
}) {
  // let timerClosure = function ({period, funStart=function () { console.log('null function funStart') }, funEnd: funEndPing,
  //   funStartArguments: [], funEndArguments: [], warming: 1 }) {
  // {period: TIMER_PING, funStart: funStartPing, funEnd: funEndPing,
  // funStartArguments: [], funEndArguments: [], warming: 1 }

  // let period = timerConfigObj.period;
  // let funStart = timerConfigObj.funStart || function () { console.log('null function funStart') };
  // let funEnd = timerConfigObj.funEnd || function () { console.log('null function funEnd') };
  // let funStartArguments = timerConfigObj.funStartArguments || [];
  // let funEndArguments = timerConfigObj.funStartArguments || [];
  // let warming = timerConfigObj.warming || 0;
  let id;

  let count = 0;// для разогрева - т.е не сразу начинать
  function start() {
    clearInterval(id);
    count++;
    if (count > warming) {
      id = setInterval(() => {
        // console.log('warming=', warming);
        if (funStart) funStart(...funStartArguments);
      }, period);
    }
  }

  function stop() {
    clearInterval(id);
    if (funEnd) funEnd(...funEndArguments);


    // funEnd(...funEndArguments);
  }

  return { start, stop }
};

let funStartPing = (ws) => {
  let timeNaw = new Date().getTime();
  console.log('This  Ping start timeNaw=', timeNaw);
  ws.send(JSON.stringify({ "cmd": "ping" }));
};
let funEndPing = () => {
  let timeNaw = new Date().getTime();
  console.log('This Ping End timeNaw=', timeNaw);
};

let funStartReconnect = (ws) => {
  return ws.reconnect(1006, 'Reconnect error');
};

module.exports = { changeTradeArr, timeStopTestClosure, timerClosure, funStartPing, funEndPing, funStartReconnect, funStartWritting, consoleLogGroup }
