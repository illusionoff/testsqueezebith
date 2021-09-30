
const config = require('config');

const { changeTradeArr } = require('./separate/changeTradeArr');
const { consoleLogGroup } = require('./separate/consoleLogGroup');
const { timeStopTestClosure } = require('./separate/timeStopTestClosure');
const { timerClosure } = require('./separate/timerClosure');
const { funStartWritting } = require('./separate/timeClosure/funStartWritting');
const { funStartPing, funEndPing, funStartReconnect } = require('./separate/timeClosure/funsStartEnd');


module.exports = { changeTradeArr, timeStopTestClosure, timerClosure, funStartWritting, consoleLogGroup, funStartPing, funEndPing, funStartReconnect }
