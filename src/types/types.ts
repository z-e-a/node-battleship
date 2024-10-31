export type IConnection = 
  Map<string, WebSocket>;
export interface IMessage {
  type: MsgType;
  data: object;
  id: 0;
}

export const enum MsgType {
  REG = 'reg',
  UPD_WIN = 'update_winners',
  CREATE_ROOM = 'create_room',
  SINGLE = 'single_play',
  ADD_TO_ROOM = 'add_user_to_room',
  CREATE_GAME = 'create_game',
  UPD_ROOM = 'update_room',
  ADD_SHIP = 'add_ships',
  START = 'start_game',
  ATTACK = 'attack',
  RND_ATTACK = 'randomAttack',
  TURN = 'turn',
  FINISH = 'finish',
}

export interface IRegMessage extends IMessage {
  type: MsgType.REG;
  data: IRegData;
}

export interface IRegData {
  name: string;
  password: string;
}

export interface IUser {
  id: string;
  name: string;
  password: string;
  wins: number;
  connectionId?: string;
}

export interface IAddToRoomMessage extends IMessage {
  type: MsgType.ADD_TO_ROOM;
  data: IAddRoomData;
}

export interface IAddRoomData {
  indexRoom: number;
}

export interface IRoom {
  id: number;
  usersId: string[];
}

export interface IGame {
  idGame: string; 
  players: string[];
  ships: IShip[];
}

export interface IShip{
  position: {
      x: number,
      y: number,
  },
  direction: boolean,
  length: number,
  type: "small"|"medium"|"large"|"huge",
}