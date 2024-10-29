import { IAddToRoomMessage, IMessage, IRegData, IRegMessage, MsgType } from 'src/types/types';
import { UserDb } from '../userDb';

export function handleMessage(connections: Map<string, WebSocket>, connectionId: string, message: string) {
  const parsedData: IMessage = parseMessage(message);

  switch (parsedData.type) {
  case MsgType.REG: {
    const authResponse = authenticate(parsedData.data as IRegData);
    connections.get(connectionId)?.send(JSON.stringify(authResponse));
    break;
  }

  case MsgType.CREATE_ROOM:
    console.log("Create room:...");
    
    break;

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
    throw new Error("Client message or it's data is not valid json-string!")
  }
  
  if (!checkMessage(result)) {
    throw new Error("Client message contains invalid data!")
  } 
  return result;
}

function checkMessage(message: IMessage) {
  let result = true;
  switch (message.type) {
  case MsgType.REG:
    if (!(message as IRegMessage).data.name || !(message as IRegMessage).data.password) {
      result = false
    }
    break;
  case MsgType.ADD_TO_ROOM:
    if (!(message as IAddToRoomMessage).data.indexRoom) {
      result = false
    }
    break;
  
  default:
    break;
  }
  return result;
}


function authenticate(user: IRegData) {
  const userFromDb = UserDb.getInstance().getUserByName(user.name)
  console.log('authenticate user:\n', user);
  
  if (userFromDb) {
    console.log(`User ${user.name} found in DB`);
    if (user.password == userFromDb.password){
      return {
        type: MsgType.REG,
        data: JSON.stringify(user),
        id: 0
      }  
    } else {
      console.log(`Wrong password: ${user.password} expect ${userFromDb.password}`);
      
      return {
        type: MsgType.REG,
        data: '{error: "Wrong password"}',
        id: 0
      }  
    }
  } else {
    console.log(`User ${user.name} not found in DB...`);
    UserDb.getInstance().createUser(user);
    return {
      type: MsgType.REG,
      data: JSON.stringify(user),
      id: 0
    }
  }
}
