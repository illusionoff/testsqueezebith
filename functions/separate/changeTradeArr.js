
const { consoleLogGroup } = require('./consoleLogGroup');

function changeTradeArr(initialObj) {
  let buy = initialObj.buy;
  let sell = initialObj.sell;
  // выход при устаревании данных
  // инициализация первых предыдущих значений
  // проверка изменения значения для предотвращения лишних вычислений
  initialObj.time = new Date().getTime();
  let diffTimeServer = initialObj.time - initialObj.messageObj.timestamp;
  let diffTimeVer = initialObj.messageObj.timestamp - parseInt(initialObj.messageObj.data.ver, 10);
  initialObj.orderbookFirstPreviousBay = buy;
  initialObj.orderbookFirstPreviousSell = sell;
  consoleLogGroup`changeTradeArr() initialObj.orderbookFirstPreviousBay = ${initialObj.orderbookFirstPreviousBay}
  sell = ${sell}
  buy= ${buy}`;
  const arrLengthBay = initialObj.arrChart.length;
  initialObj.arrChart.push([arrLengthBay, buy, sell, initialObj.time, initialObj.messageObj.data.ver, diffTimeVer, initialObj.messageObj.timestamp, diffTimeServer]);
  return true
}

module.exports = { changeTradeArr }
