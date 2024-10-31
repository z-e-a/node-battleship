import { IGame, IRoom, IShip } from '../types/types';

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

  getByPlayerId(playerId: string) {
    return this.records.filter((rec) => rec.players.includes(playerId))[0];
  }

  createGame(room: IRoom, userId: string) {
    let isUniq = false;
    let newUuid = '';
    while (!isUniq) {
      newUuid = crypto.randomUUID();
      isUniq = this.records.filter((rec) => rec.idGame === newUuid).length === 0;
    }
    const newGame: IGame = {
      idGame: newUuid,
      players: room.usersId.slice(),
      ships:  new Map<string, IShip[]>(),
      currentPlayerId: userId,
    };
    this.records.push(newGame);
    return newGame.idGame;
  }

  addShips(gameId: string, playerId: string, ships: IShip[]) {
    const game = this.records.filter((rec) => rec.idGame === gameId)[0];
    game.ships.set(playerId, ships);
  }
}
