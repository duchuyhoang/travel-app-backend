import { Client, QueryConfig } from "pg";
import { BaseDao } from "./BaseDao";
import { Tag } from "@models/Tag";

export class TagDao extends BaseDao {
  constructor(client: Client) {
    super(client, "tag");
  }
  public deleteTags(ids: Array<string>) {
    return this.getClient().query({
      text: `DELETE FROM ${this.tableName} WHERE id_tag IN (${ids.join(",")})`,
    });
  }
}
