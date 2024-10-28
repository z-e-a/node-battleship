import { WebSocketServer } from 'ws';
import { httpServer } from './http_server';

const HTTP_PORT = 8181;

console.log(`Start static http server on the http://localhost:${HTTP_PORT}`);
httpServer.listen(HTTP_PORT);
const WS_PORT = 3000;

const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', function connection(ws) {
  console.log(`New client connected`);

  ws.on('error', console.error);

  ws.on('message', function message(data: string) {
    const parsedData = JSON.parse(String(data));
    console.log(parsedData);
    if (parsedData.type === 'reg') this.send(JSON.stringify(parsedData));
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

wss.on('listening', () => {
  console.log(`Websocket server start listening port:${WS_PORT}`);
});

wss.on('close', () => {
  console.log(`Websocket server shutting down...`);
});

process.on('SIGINT', async function () {
  if (wss.clients.size) {
    let clientCounter = 1;
    wss.clients.forEach(async (socket) => {
      if (socket.readyState === socket.OPEN) {
        console.log(`Send termination request to connected client #${clientCounter}`);
        await socket.close();
        process.nextTick(() => {
          if (socket.readyState === socket.OPEN || socket.CLOSING) {
            socket.terminate();
          }
        });
        clientCounter++;
      }
    });
  } else {
    console.log('No connected clients...');
  }
  await wss.close();

  setTimeout(() => {
    process.exit();
  }, 1000);
});
