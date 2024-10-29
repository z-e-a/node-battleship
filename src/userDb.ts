import { IRegData, IUser } from "./types/types";

export class UserDb {
  private static userDb:UserDb = new UserDb()
  private records: IUser[] = [];

  static getInstance() {
    return this.userDb;
  }

  public getAllUsers(): IUser[] {
    return this.records;
  }

  getUserById(id: string) {
    return this.records.filter((rec) => rec.id === id)[0];
  }

  getUserByName(name: string) {
    return this.records.filter((rec) => rec.name === name)[0];
  }

  createUser(newUser: IRegData) {
    console.log(`Create user ${newUser.name} with password ${newUser.password}`);
    
    let isUniq = false;
    let newUuid = '';
    while (!isUniq) {
      newUuid = crypto.randomUUID();
      isUniq = this.records.filter((rec) => rec.id === newUuid).length === 0;
    }
    const newUserRecord = { id: newUuid, ...newUser, wins: 0 };
    this.records = [...this.records, newUserRecord];
    return newUserRecord;
  }
}