
const config = require('config');

const { changeTradeArr } = require('./separate/changeTradeArr');
const { funStartWritting } = require('./separate/funStartWritting');
const { consoleLogGroup } = require('./separate/consoleLogGroup');
const { timeStopTestClosure } = require('./separate/timeStopTestClosure');
const { timerClosure } = require('./separate/timerClosure');
const { funStartPing, funEndPing, funStartReconnect } = require('./separate/timerClosure/funsStartEnd');


module.exports = { changeTradeArr, timeStopTestClosure, timerClosure, funStartWritting, consoleLogGroup, funStartPing, funEndPing, funStartReconnect }
