import MySQLRes from "contracts/res";
import MySQLQuery from "./query";

class MySQL {
  #lib: any = null;

  constructor(opts: { [key: string]: number | string }) {
    this.#lib = require('../../build/Release/arnelify-orm.node');
    this.#lib.orm_mysql_create(JSON.stringify(opts));
  }

  /**
  * Logger
  * @param {string} message 
  * @param {boolean} isError 
  */
  #logger = (message: string, isError: boolean): void => {
    if (isError) {
      console.log(`[Arnelify ORM]: NodeJS error: ${message}`);
      return;
    }

    console.log(`[Arnelify ORM]: ${message}`);
  };

  /**
   * Alter Table
   * @param {string} tableName 
   * @param {CallableFunction} condition 
   */
  alterTable(tableName: string, condition: CallableFunction): void {
    const builder: MySQLQuery = new MySQLQuery();
    builder.setGetUuIdCallback(() => this.getUuid());
    builder.onQuery(async (query: string, bindings: string[] = []): Promise<MySQLRes> => {
      return this.exec(query, bindings);
    });

    builder.alertTable(tableName, condition);
  }

  /**
   * Create Table
   * @param {string} tableName 
   * @param {CallableFunction} condition 
   */
  createTable(tableName: string, condition: CallableFunction): void {
    const builder: MySQLQuery = new MySQLQuery();
    builder.setGetUuIdCallback(() => this.getUuid());
    builder.onQuery(async (query: string, bindings: string[] = []): Promise<MySQLRes> => {
      return this.exec(query, bindings);
    });

    builder.createTable(tableName, condition);
  }

  /**
   * Close
   */
  close(): void {
    this.#lib.orm_mysql_close();
  }

  /**
   * Connect
   */
  connect(): void {
    this.#lib.orm_mysql_connect();
  }

  /**
   * Destroy
   */
  destroy(): void {
    this.#lib.orm_mysql_destroy();
  }

  /**
   * Drop Table
   * @param {string} name 
   * @param {Array} args 
   */
  dropTable(name: string, args: string[] = []): void {
    const builder: MySQLQuery = new MySQLQuery();
    builder.setGetUuIdCallback(() => this.getUuid());
    builder.onQuery(async (query: string, bindings: string[] = []): Promise<MySQLRes> => {
      return this.exec(query, bindings);
    });

    builder.dropTable(name, args);
  }

  /**
  * Exec
  * @param {null | string} query 
  * @param {Array} bindings 
  * @returns 
  */
  async exec(query: null | string = null, bindings: string[] = []): Promise<MySQLRes> {
    const fBindings: string = JSON.stringify(bindings);
    const serialized: string = this.#lib.orm_mysql_exec(query, fBindings);

    let res: MySQLRes = [];
    try {
      res = JSON.parse(serialized);
    } catch (err) {
      this.#logger('Res must be a valid JSON.', true);
    }

    return res;
  }

  /**
   * getUuid
   * @returns
   */
  getUuid(): string {
    return this.#lib.orm_mysql_get_uuid();
  }

  /**
   * Table
   */
  table(name: string): MySQLQuery {
    const builder: MySQLQuery = new MySQLQuery();
    builder.setGetUuIdCallback(() => this.getUuid());
    builder.onQuery(async (query: string, bindings: string[] = []): Promise<MySQLRes> => {
      return this.exec(query, bindings);
    });

    return builder.table(name);
  }

  /**
   * To JSON
   * @param {object} res 
   * @returns 
   */
  toJson(res: MySQLRes) {
    return JSON.stringify(res);
  }
}

export default MySQL;