ws.onmessage = function (evt) {
  console.log('typeof evt.data:', typeof evt.data);
  let messageGateObj = JSON.parse(evt.data);
  console.log('Array.isArray(messageGateObj.params) ', Array.isArray(messageGateObj.params));
  console.log('messageGateObj.params', messageGateObj.params);
  console.log('messageGateObj:', messageGateObj);
  // console.log('messageGateObj.params.length()', messageGateObj.params.length); // ошибка Cannot read property 'length' of undefined
  console.log('messageGateObj.params.constructor.name === Array', messageGateObj.params.constructor.name === 'Array');  // ошибка Cannot read property 'constructor' of undefined
  let toString = {}.toString;
  console.log('toString.call(messageGateObj.params)=', toString.call(messageGateObj.params)); // [object Array]
};
