import {
  IAddRoomData,
  IAddShipsData,
  IAddToRoomMessage,
  IAttackData,
  IConnection,
  IMessage,
  IRegData,
  IRegMessage,
  MsgType,
  Position,
} from 'src/types/types';
import { UserDb } from '../store/userDb';
import { RoomDb } from '../store/roomDb';
import { GameDb } from '../store/gameDb';

export function handleMessage(connections: Map<string, WebSocket>, connectionId: string, message: string) {
  const parsedData: IMessage = parseMessage(message);

  switch (parsedData.type) {
    case MsgType.REG: {
      const authResponse = authenticate(parsedData.data as IRegData, connectionId);
      connections.get(connectionId)?.send(JSON.stringify(authResponse));
      if (!authResponse.error) {
        sendRoomUpdate(connections);
      }
      break;
    }

    case MsgType.CREATE_ROOM: {
      console.log('Creating the room...');
      const userFromDb = UserDb.getInstance().getUserByConnectionId(connectionId);
      const errorText = RoomDb.getInstance().createRoom(userFromDb);
      if (!errorText) {
        sendRoomUpdate(connections);
      } else {
        const response = {
          type: MsgType.CREATE_ROOM,
          error: true,
          errorText,
          id: 0,
        };
        connections.get(connectionId)?.send(JSON.stringify(response));
      }
      break;
    }

    case MsgType.ADD_TO_ROOM: {
      console.log('Adding user the room...');
      const userFromDb = UserDb.getInstance().getUserByConnectionId(connectionId);
      const roomId = (parsedData.data as IAddRoomData).indexRoom;
      RoomDb.getInstance().addUser(roomId, userFromDb);

      if (RoomDb.getInstance().getById(roomId).usersId.length >= 2) {
        const newGameId = GameDb.getInstance().createGame(RoomDb.getInstance().getById(roomId), userFromDb.id);
        sendGameCreated(connections, newGameId);
      }
      sendRoomUpdate(connections);
      break;
    }

    case MsgType.ADD_SHIP: {
      console.log('Adding ships to the game...');
      const userFromDb = UserDb.getInstance().getUserByConnectionId(connectionId);
      GameDb.getInstance().addShips(
        (parsedData.data as IAddShipsData).gameId,
        userFromDb.id,
        (parsedData.data as IAddShipsData).ships,
      );

      const currentGame = GameDb.getInstance().getByPlayerId(userFromDb.id);
      const shipsState: boolean[] = [];
      currentGame.ships.forEach((playerShips) => {
        shipsState.push(playerShips.length > 0);
      });
      const isShipsReady = shipsState.reduce((res, state) => res && state, true);
      if (currentGame.ships.size > 1 && isShipsReady) {
        GameDb.getInstance().start(currentGame);
        sendStartGame(connections, currentGame.idGame);
        sendTurn(connections, currentGame.idGame);
      }
      break;
    }

    case MsgType.RND_ATTACK:
    case MsgType.ATTACK: {
      const currentGame = GameDb.getInstance().getById((parsedData.data as IAttackData).gameId);
      const userFromDb = UserDb.getInstance().getUserById(
        currentGame.players[(parsedData.data as IAttackData).indexPlayer - 1],
      );

      const enemy = UserDb.getInstance().getUserById(String(currentGame.enemies.get(userFromDb.id)));
      const enemyField = currentGame.fields?.get(enemy.id);
      const enemyAvailableCells = currentGame.availableCells?.get(enemy.id);
      if (!enemyField || !enemyAvailableCells || currentGame.currentPlayerId != userFromDb.id) {
        break;
      }

      let attackedPosition;

      if (parsedData.type == MsgType.ATTACK) {
        console.log('Attack...');
        attackedPosition = {
          x: (parsedData.data as IAttackData).x,
          y: (parsedData.data as IAttackData).y,
        };
        if (!enemyAvailableCells.has(JSON.stringify(attackedPosition))) {
          console.log(`Position ${JSON.stringify(attackedPosition)} not allowed`);
          break;
        }
      } else {
        console.log('Random attack...');
        const rndIdx = Math.floor(Math.random()) * enemyAvailableCells.size;
        const rndPosition = Array.from(enemyAvailableCells)[rndIdx];
        attackedPosition = JSON.parse(rndPosition);
      }

      enemyField[attackedPosition.x][attackedPosition.y].isFired = true;
      const enemyShip = enemyField[attackedPosition.x][attackedPosition.y].ship;
      let attackResult = 'miss';
      if (enemyShip) {
        if (enemyShip.health && enemyShip.health > 0) {
          enemyShip.health--;
          attackResult = enemyShip.health == 0 ? 'killed' : 'shot';
        }
      }

      sendAttackResponse(connections, currentGame.idGame, attackedPosition, attackResult);

      if (attackResult == 'killed') {
        const enemyShipX = enemyField[attackedPosition.x][attackedPosition.y].ship?.position.x;
        const enemyShipY = enemyField[attackedPosition.x][attackedPosition.y].ship?.position.y;
        const enemyShipLength = enemyField[attackedPosition.x][attackedPosition.y].ship?.length ?? 0;
        const enemyShipDirection = enemyField[attackedPosition.x][attackedPosition.y].ship?.direction;

        for (let i = -1; i <= enemyShipLength; i++) {
          for (let shift = -1; shift <= 1; shift += 2) {
            const shiftedPos = {
              x: enemyShipX! + (enemyShipDirection ? shift : i),
              y: enemyShipY! + (enemyShipDirection ? i : shift),
            };
            if (isPositionValid(shiftedPos)) {
              sendAttackResponse(connections, currentGame.idGame, shiftedPos, 'miss');
            }
          }
        }

        const shiftedPosBefore = {
          x: enemyShipX! + (enemyShipDirection ? 0 : -1),
          y: enemyShipY! + (enemyShipDirection ? -1 : 0),
        };
        if (isPositionValid(shiftedPosBefore)) {
          sendAttackResponse(connections, currentGame.idGame, shiftedPosBefore, 'miss');
        }
        
        const shiftedPosAfter = {
          x: enemyShipX! + (enemyShipDirection ? 0 : enemyShipLength),
          y: enemyShipY! + (enemyShipDirection ? enemyShipLength : 0),
        };
        if (isPositionValid(shiftedPosAfter)) {
          sendAttackResponse(connections, currentGame.idGame, shiftedPosAfter, 'miss');
        }
      }

      if (attackResult == 'miss') GameDb.getInstance().makeTurn(currentGame.idGame);
      sendTurn(connections, currentGame.idGame);

      enemyAvailableCells.delete(JSON.stringify(attackedPosition));
      break;
    }

    default:
      break;
  }
}

function parseMessage(message: string) {
  let result;
  try {
    result = JSON.parse(message);
    if (result.data) {
      result.data = JSON.parse(result.data);
    }
  } catch (e) {
    console.log(e);
    throw new Error("Client message or it's data is not valid json-string!");
  }

  if (!checkMessage(result)) {
    throw new Error('Client message contains invalid data!');
  }
  return result;
}

function checkMessage(message: IMessage) {
  let result = true;
  switch (message.type) {
    case MsgType.REG:
      if (!(message as IRegMessage).data.name || !(message as IRegMessage).data.password) {
        result = false;
      }
      break;
    case MsgType.ADD_TO_ROOM:
      if (!(message as IAddToRoomMessage).data.indexRoom) {
        result = false;
      }
      break;

    default:
      break;
  }
  return result;
}

function authenticate(user: IRegData, connectionId: string) {
  const userFromDb = UserDb.getInstance().getUserByName(user.name);
  console.log('authenticate user:\n', user);

  if (userFromDb) {
    console.log(`User ${user.name} found in DB`);
    if (user.password == userFromDb.password) {
      UserDb.getInstance().setConnectionId(userFromDb, connectionId);
      return {
        type: MsgType.REG,
        data: JSON.stringify(user),
        id: 0,
      };
    } else {
      console.log(`Wrong password: ${user.password} expect ${userFromDb.password}`);

      return {
        type: MsgType.REG,
        index: userFromDb.id,
        error: true,
        errorText: 'error: "Wrong password"',
        id: 0,
      };
    }
  } else {
    console.log(`User ${user.name} not found in DB...`);
    UserDb.getInstance().createUser(user, connectionId);
    return {
      type: MsgType.REG,
      data: JSON.stringify(user),
      id: 0,
    };
  }
}

export function sendRoomUpdate(connections: Map<string, WebSocket>) {
  const rooms = RoomDb.getInstance().getFreeRooms();
  const data = JSON.stringify(
    rooms.map((room) => {
      const roomUsersData = room.usersId.map((userId) => {
        const userFromDb = UserDb.getInstance().getUserById(userId);
        return {
          name: userFromDb.name,
          index: 1,
        };
      });
      return {
        roomId: room.id,
        roomUsers: roomUsersData,
      };
    }),
  );
  const response = {
    type: MsgType.UPD_ROOM,
    data,
    id: 0,
  };

  connections.forEach(async (conn) => {
    if (conn.readyState === conn.OPEN) {
      conn.send(JSON.stringify(response));
    }
  });
}

function sendGameCreated(connections: IConnection, newGameId: string) {
  const newGame = GameDb.getInstance().getById(newGameId);
  newGame.players.forEach((userId: string) => {
    const userFromDb = UserDb.getInstance().getUserById(userId);
    if (!userFromDb) {
      throw new Error('User in room not found!');
    } else {
      const gameData = JSON.stringify({
        idGame: newGame.idGame,
        idPlayer: newGame.players.indexOf(userFromDb.id) + 1,
      });
      const createGameResponse = {
        type: MsgType.CREATE_GAME,
        data: gameData,
        id: 0,
      };
      const connection = connections.get(String(userFromDb.connectionId));
      connection?.send(JSON.stringify(createGameResponse));
    }
  });
}

function sendStartGame(connections: IConnection, gameId: string) {
  const currentGame = GameDb.getInstance().getById(gameId);
  currentGame.players.forEach((userId: string) => {
    const userFromDb = UserDb.getInstance().getUserById(userId);
    if (!userFromDb) {
      throw new Error('User not found!');
    } else {
      const gameData = JSON.stringify({
        currentPlayerIndex: currentGame.players.indexOf(currentGame.currentPlayerId) + 1,
        ships: currentGame.ships.get(userId),
      });
      const createGameResponse = {
        type: MsgType.START,
        data: gameData,
        id: 0,
      };
      const connection = connections.get(String(userFromDb.connectionId));
      connection?.send(JSON.stringify(createGameResponse));
    }
  });
}

function sendTurn(connections: IConnection, gameId: string) {
  const currentGame = GameDb.getInstance().getById(gameId);
  currentGame.players.forEach((userId) => {
    const userFromDb = UserDb.getInstance().getUserById(userId);
    const turnResponse = {
      type: MsgType.TURN,
      data: JSON.stringify({
        currentPlayer: currentGame.players.indexOf(currentGame.currentPlayerId) + 1,
      }),
      id: 0,
    };
    const connection = connections.get(String(userFromDb.connectionId));
    connection?.send(JSON.stringify(turnResponse));
  });
}

function sendAttackResponse(connections: IConnection, gameId: string, position: Position, status: string) {
  const currentGame = GameDb.getInstance().getById(gameId);
  currentGame.players.forEach((userId) => {
    const userFromDb = UserDb.getInstance().getUserById(userId);
    const attackResponse = {
      type: MsgType.ATTACK,
      data: JSON.stringify({
        currentPlayer: currentGame.players.indexOf(currentGame.currentPlayerId) + 1,
        position,
        status,
      }),
      id: 0,
    };
    const connection = connections.get(String(userFromDb.connectionId));
    connection?.send(JSON.stringify(attackResponse));
  });
}

function isPositionValid(position: Position) {
  return position.x >= 0 && position.x < 10 && position.y >= 0 && position.y < 10;
}
