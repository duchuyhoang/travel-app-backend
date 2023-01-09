import { convertDataToUpdateQuery } from "@helpers/*";
import { Client, QueryConfig } from "pg";
import PGP from "pg-promise";
// pgp.Column()
export type Key_And_Value = {
  key: string;
  value: any;
};

export enum WHERE_OPERATOR {
  AND = "AND",
  OR = "OR",
}
export interface BaseConfigs {
  whereOperator?: WHERE_OPERATOR;
}

export type WhereConfig = Key_And_Value & {
  operator?: WHERE_OPERATOR;
  startRound?: boolean;
  endRound?: boolean;
  notEqual?: boolean;
};

export interface SelectConfigs extends BaseConfigs {}
export interface UpdateConfigs {
  remainFieldIfNull?: boolean;
}
export abstract class BaseDao {
  public schema: string;
  constructor(private client: Client, public tableName: string) {
    this.schema = process.env.DBSCHEMA || "public";
  }
  public getClient(): Client {
    return this.client;
  }
  public generateInsertListField(fields: Array<string>) {
    return `(${fields.join(",")})`;
  }
  public generateSinglePlaceholder(count: number) {
    return `VALUES(${new Array(count)
      .fill(null)
      .map((v, index) => `$${index + 1}`)
      .join(",")})`;
  }
  public generateWhereClause = () => {
    {
    }
  };
  public getTableNameWithSchema() {
    return `${this.schema}.${this.tableName}`;
  }

  public getAll(options: {
    fields?: Array<string>;
    wheres?: Array<WhereConfig>;
  }) {
    const { fields, wheres } = options;
    let index = 0;
    const values: Array<any> = [];
    const whereClause =
      !!!wheres || wheres.length === 0
        ? ""
        : `WHERE ${wheres
            .map((v, i) => {
              index++;
              values.push(v.value);
              return `${v.startRound && wheres.length > 1 ? "(" : ""}${v.key}${
                !v.notEqual ? "=" : "<>"
              }$${index}${v.endRound && wheres.length > 1 ? ")" : ""} ${
                i < wheres.length - 1 ? (v.operator ? v.operator : "AND") : ""
              }`;
            })
            .join(" ")}`;

    const query: QueryConfig = {
      text: `SELECT ${fields ? fields.join(",") : "*"} FROM ${
        this.tableName
      } ${whereClause}`,
      values,
    };

    return this.client.query(query);
  }

  public updateOne(
    updates: Array<Key_And_Value>,
    wheres: Array<WhereConfig>,
    configs?: UpdateConfigs
  ) {
    let index = 0;
    const values: Array<any> = [];
    const queryFieldClause = updates
      .map((v) => {
        index++;
        values.push(v.value);
        return (
          `${v.key}=` +
          (configs?.remainFieldIfNull ? `COALESCE(` : "") +
          `$${index}` +
          (configs?.remainFieldIfNull ? `,${v.key})` : "")
        );
      })
      .join(",");

    const whereClause =
      wheres.length === 0
        ? ""
        : `WHERE ${wheres
            .map((v, i) => {
              index++;
              values.push(v.value);
              return `${v.startRound && wheres.length > 1 ? "(" : ""}${
                v.key
              }=$${index}${v.endRound && wheres.length > 1 ? ")" : ""} ${
                i < wheres.length - 1 ? (v.operator ? v.operator : "AND") : ""
              }`;
            })
            .join(" ")}`;
    const query: QueryConfig = {
      text: `UPDATE ${this.getTableNameWithSchema()} SET ${queryFieldClause} ${whereClause} RETURNING *`,
      values,
    };
    return this.client.query(query);
  }
  public insertOne(
    payload: { [key: string]: any },
    options?: {
      onConflictQuery?: string;
    }
  ) {
    const fields = Object.keys(payload);
    const text = `INSERT INTO ${this.getTableNameWithSchema()}${this.generateInsertListField(
      fields
    )} ${this.generateSinglePlaceholder(fields.length)} ${
      options?.onConflictQuery || ""
    } RETURNING *`;
    return this.client.query(
      text,
      fields.map((key) => payload[key])
    );
  }

  public bulkInsert(
    payloads: Array<Key_And_Value>,
    options?: {
      onConflictQuery?: string;
    }
  ) {
    const pgp = PGP({});
    const columns: Array<string> = [],
      datas: Array<any> = [];
    let maxValueCount = 0;
    payloads.forEach(
      (record) =>
        (maxValueCount = Math.max(maxValueCount, record.value?.length || 0))
    );

    payloads.forEach((record) => {
      const { value, key } = record;
      columns.push(key);
      for (let i = 0; i < maxValueCount; i++) {
        if (datas[i]) {
          datas[i] = {
            ...datas[i],
            [key]: value?.[i] || null,
          };
        } else {
          datas[i] = {
            [key]: value?.[i] || null,
          };
        }
      }
    });

    const columnSet = new pgp.helpers.ColumnSet(columns, {
      table: this.tableName,
    });
    return this.client.query(
      pgp.helpers.insert(datas, columnSet) +
        (options?.onConflictQuery || "") +
        " RETURNING *"
    );
  }
}
