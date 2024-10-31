import { IRoom, IUser } from '../types/types';

export class RoomDb {
  private static readonly roomDb: RoomDb = new RoomDb();
  private readonly records: IRoom[] = [];
  private idx: number = 1;

  static getInstance() {
    return this.roomDb;
  }

  public getAllRooms(): IRoom[] {
    return this.records;
  }

  public getFreeRooms(): IRoom[] {
    return this.records.filter((rec) => rec.usersId.length <= 1);
  }

  getById(id: number) {
    return this.records.filter((rec) => rec.id === id)[0];
  }

  createRoom(user: IUser) {
    const userRooms = this.records.filter((rec) => rec.usersId.includes(user.id));
    if (userRooms.length > 0) {
      return 'User already in room!';
    } else {
      this.records.push({ id: this.idx, usersId: [user.id] });
      console.log(`${user.name} created new room #${this.idx}`);
      this.idx += 1;
      return '';
    }
  }

  addUser(roomId: number, user: IUser) {
    this.records.filter((rec) => rec.id === roomId)[0].usersId.push(user.id);
  }
}
