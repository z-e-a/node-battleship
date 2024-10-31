import { IAddRoomData, IAddToRoomMessage, IMessage, IRegData, IRegMessage, MsgType } from 'src/types/types';
import { UserDb } from '../store/userDb';
import { RoomDb } from '../store/roomDb';

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
        console.log(RoomDb.getInstance().getAllRooms());
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
      RoomDb.getInstance().addUser((parsedData.data as IAddRoomData).indexRoom, userFromDb);
      console.log(RoomDb.getInstance().getAllRooms());
      sendRoomUpdate(connections);
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
          index: userFromDb.id,
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
