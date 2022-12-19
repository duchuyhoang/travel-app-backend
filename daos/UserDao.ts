import { Client, QueryConfig } from "pg";
import { BaseDao } from "./BaseDao";
import { User } from "@models/User";
import { AUTH_METHOD } from "@common/enum";
interface SignUpPayload extends Omit<User, "id"> {}
export class UserDao extends BaseDao {
  constructor(client: Client) {
    super(client, "users");
    this.signUp = this.signUp.bind(this);
    this.getUserByEmailAndMethod = this.getUserByEmailAndMethod.bind(this);
  }
  public signUp(payload: SignUpPayload) {
    return this.insertOne(payload);
  }

  public getUserByEmailAndMethod(email: string, method: AUTH_METHOD) {
    const fields = ["email", "method"];
    const query: QueryConfig = {
      text: `SELECT * FROM ${this.getTableNameWithSchema()} WHERE email=$1 AND method=$2 LIMIT 1`,
      values: [email, method],
    };
    return this.getClient().query(query);
  }
}
