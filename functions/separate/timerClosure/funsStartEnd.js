

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

module.exports = { funStartPing, funEndPing, funStartReconnect }
