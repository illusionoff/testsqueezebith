const util = require('util');

function consoleLogGroup(strings, ...expressions) {
  const inspectOptions = { showHidden: false, colors: true, depth: null }// depth: null глубокий вывод. compact: true минимизация количества строк
  let strOut = '';
  function trim(str) { return str.split('\n').map((item) => item.trim()).join('\n') }//удаляем лишние пробелы для устранения эффекта форматирования шаблонных строк VSCode.
  expressions.forEach((value, i) => {
    if (i === expressions.length - 1) {
      strOut += ' ' + trim(strings[i]) +
        util.formatWithOptions(inspectOptions, value) + ' ' +
        trim(strings[strings.length - 1]);
    }// Добавляем последний строковой литерал
    else strOut += ' ' + trim(strings[i]) + ' ' + util.formatWithOptions(inspectOptions, value);
  })
  // console.log(util.formatWithOptions({ showHidden: false, colors: true }, expressions[3]));// depth: null глубокий вывод
  // console.log(util.inspect(expressions[3], { showHidden: false, colors: true }))// depth: null глубокий вывод объектов и цветом
  console.log(strOut);
}

module.exports = { consoleLogGroup }
