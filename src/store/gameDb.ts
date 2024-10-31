import { IGame, IRoom} from '../types/types';

export class GameDb {
  private static readonly gameDb: GameDb = new GameDb();
  private readonly records: IGame[] = [];

  static getInstance() {
    return this.gameDb;
  }

  public getAllGames(): IGame[] {
    return this.records;
  }

  getById(id: string) {
    return this.records.filter((rec) => rec.idGame === id)[0];
  }

  createGame(room: IRoom) {
    let isUniq = false;
    let newUuid = '';
    while (!isUniq) {
      newUuid = crypto.randomUUID();
      isUniq = this.records.filter((rec) => rec.idGame === newUuid).length === 0;
    }
    const newGame: IGame = {
      idGame: newUuid,
      players: room.usersId.slice(),
      ships:[]
    };
    this.records.push(newGame);
    return newGame.idGame;
  }
}
