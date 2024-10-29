import { WebSocketServer } from 'ws';
import { httpServer } from './http_server';
import { handleMessage } from './ws_server/utils';

const HTTP_PORT = 8181;

console.log(`Start static http server on the http://localhost:${HTTP_PORT}`);
httpServer.listen(HTTP_PORT);
const WS_PORT = 3000;

const wss = new WebSocketServer({ port: WS_PORT });

const connections = new Map<string, WebSocket>();

wss.on('connection', function connection(ws: WebSocket) {
  const connectionId = crypto.randomUUID();
  connections.set(connectionId, ws);
  console.log(`New client connected ${connectionId}`);

  ws.onerror = (err: Error) => {
    console.error(`connection id: ${connectionId}\n${err}`);
  };

  ws.onmessage = (ev: MessageEvent) => {
    console.log(`Client ${connectionId} sent: %s`, ev.data);
    try {
      handleMessage(connections, connectionId, ev.data);
    } catch (e) {
      console.error(e);
    }    
    return ev.data;
  };

  ws.onclose = () => {
    connections.delete(connectionId);
    console.log(`Client with id:${connectionId} disconnected`);
  };
});

wss.on('listening', () => {
  console.log(`Websocket server start listening port:${WS_PORT}`);
});

wss.on('close', () => {
  console.log(`Websocket server shutting down...`);
});

process.on('SIGINT', async function () {
  connections.forEach(async (conn, id) => {
    if (conn.readyState === conn.OPEN) {
      console.log(`Closing connection with id:${id}`);
      await conn.close();
    }
  });

  await wss.close();

  setTimeout(() => {
    process.exit();
  }, 1000);
});
