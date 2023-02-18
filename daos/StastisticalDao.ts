import { DEL_FLAG } from "@common/enum";
import { Client, QueryConfig } from "pg";
import { BaseDao } from "./BaseDao";
import moment from "moment";
export class StastisticalDao {
  constructor(private client: Client) {}
  public getTotalPostByDateRange(start: string, end: string) {
    console.log(start, end, moment(new Date(parseInt(start))).valueOf());
    return this.client.query({
      text: `SELECT 
        EXTRACT(YEAR FROM create_at) as y,
        EXTRACT(MONTH FROM create_at) as mo,
        EXTRACT(DAY FROM create_at) as d,
        count(*) as item_count
        FROM posts
        WHERE create_at < to_timestamp($1) AND create_at > to_timestamp($2)
        GROUP BY y,mo,d`,
      values: [
        moment(new Date(parseInt(end))).valueOf(),
        moment(new Date(parseInt(start))).valueOf(),
      ],
    });
  }
}
