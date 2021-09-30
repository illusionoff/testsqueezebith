const fs = require("fs");
const config = require('config');
const { consoleLogGroup } = require('../consoleLogGroup');

let funStartWritting = (arrChart) => {
  const timeNow = new Date().getTime();
  let result = squeeze(arrChart, 1);
  let result2 = squeeze(arrChart, 2);
  console.log('result=', result);
  console.log('result2=', result2);
  // для теста создания файла отчета result = true; config/default.json -> "ANALYSIS_PERIOD": 300000 поменять на 50000 "MIN_SQUEEZE_PERCENT": 0.015 поменять на -0.015
  // result = true;
  if (result || result2) {
    let str = '';
    const arrBay = arrChart.map((item) => item + '\n'); //"\r\n"
    str += arrBay.join('');
    console.log('str=', str);
    let computesBay = computes(arrChart);
    let arrTempBay = arrChart.map((item) => item[1]);
    let arrTempSell = arrChart.map((item) => item[2]);
    const resDiffMaxIndexSell = diffMaxIndexS({ arr: arrTempSell, sell: true });
    const resDiffMaxIndexBay = diffMaxIndexS({ arr: arrTempBay, sell: false });
    const strComputes = `\n averag diffTimeVer = ${computesBay.diffTimeVer} \n averag diffTimeServer = ${computesBay.diffTimeServer}`;

    consoleLogGroup`arrTemp.arrTempSell.length = ${arrTempSell.length}
      arrTempSell = ${arrTempSell}
      arrTempBay = ${arrTempBay}
      diffMaxIndexS({ arr: arrTemp, sell: true }) = ${resDiffMaxIndexSell}
      diffMaxIndexS({ arr: arrTemp, sell: false }) = ${resDiffMaxIndexBay}
      strComputes = ${strComputes}`;

    const resDiffMaxIndex = `\n resDiffMaxIndexSell = ${resDiffMaxIndexSell}\n resDiffMaxIndexBay = ${resDiffMaxIndexBay}`;
    str += strComputes + resDiffMaxIndex;
    fs.writeFile(`logs/${timeNow}_testQueezeBith.csv`, str, function (error) {
      if (error) throw error;
      console.log("Запись файла завершена.");
    });
  }
  // обнуляем массив
  arrChart.length = 0;
}

function squeeze(arr, strItem) {
  //  если данных нет или мало
  if (arr.length < 2) return false
  let arrTemp = arr.map((item) => item[strItem]);// цена это второй элемент сейчас в массиве для bay и третий для sell
  let sum = arrTemp.reduce((accum, item) => {
    accum += item;
    return accum;
  });
  let average = sum / arrTemp.length;
  let averageRound = average.round(8);//округляем
  let max = Math.max(...arrTemp);
  let min = Math.min(...arrTemp);
  // отклонение max - min от среднего
  let flag = (max - min) / averageRound > config.get('MIN_SQUEEZE_PERCENT') ? true : false;

  consoleLogGroup`((max - min) / averageRound)= ${(max - min) / averageRound}
  sum = ${ sum}
  average = ${average}
  averageRound= ${averageRound}
  max = ${max}
  min = ${min}
  flag = ${flag}`;
  return flag
}
//  находим наибольшоую разницу
function diffMaxIndex(obj, arrDiffMaxIndex) { // obj = { arr: arr, sell: true } true = sell, false = bay
  let diffMax = obj.arr.reduce((accum, item, index, arr) => {
    let preIndex = 0;
    preIndex = index - 1;
    if (preIndex < 2) return accum
    if (arrDiffMaxIndex.includes(preIndex)) return accum
    let diff = item - arr[preIndex];
    if (obj.sell) diff = -diff;// вариант для sell = false
    if (diff > accum.diff) {
      accum.diff = diff;
      accum.index = preIndex;
      return accum
    }
    return accum
  }, { diff: 0, index: 0 }); // Начальное значение аккумулятора 0
  return diffMax.index
}
//  выводим нескольких самых больших отклонений
function diffMaxIndexS(obj) {
  //obj = { arr: arr, sell: true }
  let arrDiffMaxIndex = [];
  for (let i = 0; i < 5; i++) {// выводим 5 самых больших отклонений
    const resDiff = diffMaxIndex(obj, arrDiffMaxIndex);
    resDiff != 0 ? arrDiffMaxIndex.push(resDiff) : false
  }
  return arrDiffMaxIndex
}

function computes(arr) {
  const diffTimeVer = average(arr, 5);
  const diffTimeServer = average(arr, 7);
  console.log('computes(arr) diffTimeVer=', diffTimeVer);
  console.log('computes(arr) diffTimeServer=', diffTimeServer);
  return { diffTimeVer, diffTimeServer }
}

function average(arr, strItem) {
  const sum = arr.reduce((accum, item) => accum += item[strItem], arr[0][strItem]);
  const average = sum / arr.length;
  // const averageRound = average.round(1);//округляем
  const averageRound = Math.round(average);
  return averageRound
}
module.exports = { funStartWritting }
