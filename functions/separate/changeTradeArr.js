
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
  initialObj.orderbookFirstPreviousBuy = buy;
  initialObj.orderbookFirstPreviousSell = sell;
  consoleLogGroup`changeTradeArr() initialObj.orderbookFirstPreviousBuy = ${initialObj.orderbookFirstPreviousBuy}
  sell = ${sell}
  buy= ${buy}`;
  const arrLengthBuy = initialObj.arrChart.length;
  initialObj.arrChart.push([arrLengthBuy, buy, sell, initialObj.time, initialObj.messageObj.data.ver, diffTimeVer, initialObj.messageObj.timestamp, diffTimeServer]);
  return true
}

module.exports = { changeTradeArr }
