
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

module.exports = { timerClosure }
