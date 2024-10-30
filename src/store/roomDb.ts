import { IRoom, IUser } from "../types/types";

export class RoomDb {
  private static readonly roomDb:RoomDb = new RoomDb()
  private readonly records: IRoom[] = [];
  private idx: number = 1;

  static getInstance() {
    return this.roomDb;
  }

  public getAllRooms(): IRoom[] {
    return this.records;
  }

  getById(id: number) {
    return this.records.filter((rec) => rec.id === id)[0];
  }

  createRoom(user: IUser) {
    this.records.push({id: this.idx++, usersId: [user.id]})
    console.log(`${user.name} created new room #${this.idx}`);
  }
}