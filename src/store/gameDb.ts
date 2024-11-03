import { Field, ICell, IGame, IRoom, IShip, Position } from '../types/types';

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
      ships: new Map<string, IShip[]>(),
      currentPlayerId: userId,
      fields: new Map<string, Field>(),
      availableCells: new Map<string, Set<string>>(),
      enemies: new Map<string, string>(),
    };
    this.records.push(newGame);
    return newGame.idGame;
  }

  deleteById(gameId: string) {
    this.records.splice(this.records.findIndex(game => game.idGame == gameId), 1);
  }

  addShips(gameId: string, playerId: string, ships: IShip[]) {
    const game = this.records.filter((rec) => rec.idGame === gameId)[0];
    game.ships.set(playerId, ships);
  }

  start(game: IGame) {
    console.log('Starting the game...');

    game.ships.forEach((playerShips, playerId) => {
      const playerField: ICell[][] = [];
      const playerCells: Set<string> = new Set();
      for (let y = 0; y < 10; y++) {
        playerField[y] = [];
        for (let x = 0; x < 10; x++) {
          playerField[y][x] = {
            ship: null,
            isFired: false,
          };
          playerCells.add(JSON.stringify({ x, y }));
        }
      }

      playerShips.forEach((ship) => {
        ship.health = ship.length;
        for (let i = 0; i < ship.length; i++) {
          playerField[ship.position.x + (!ship.direction ? i : 0)][ship.position.y + (ship.direction ? i : 0)].ship =
            ship;
        }
      });

      game.fields.set(playerId, playerField);
      game.availableCells.set(playerId, playerCells);
      const enemy = game.players.filter((p) => p != playerId)[0];
      game.enemies.set(playerId, enemy);
    });
  }

  makeTurn(gameId: string) {
    console.log('Making turn...');
    const game = this.records.filter((rec) => rec.idGame === gameId)[0];
    const nextPlayerID = game.enemies.get(game.currentPlayerId);
    game.currentPlayerId = String(nextPlayerID);
  }
}
