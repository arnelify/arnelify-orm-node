import MySQLRes from "contracts/res";

class MySQLQuery {

  #hasHaving: boolean = false;
  #hasOn: boolean = false;
  #hasWhere: boolean = false;

  #bindings: string[] = [];
  #tableName: string = '';
  #columns: string[] = [];
  #indexes: string[] = [];
  #query: string = '';

  /**
   * Callback
   * @param query 
   * @param bindings 
   * @returns 
   */
  #callback = async (query: string, bindings: string[]): Promise<MySQLRes> => {
    const res: MySQLRes = [];
    console.log(query);
    return res;
  };

  /**
   * Get UUID Callback
   * @returns 
   */
  #getUuIdCallback = (): string => {
    return '';
  };

  /**
   * Condition
   * @param {string} column
   * @param {null | number | string} arg2 
   * @param {null | number | string} arg3 
   * @returns 
   */
  #condition(bind: boolean = true, column: string,
    arg2: null | number | string, arg3: null | number | string = null): void {
    if (this.#isOperator(arg2)) {
      const operator_: string = String(arg2);
      if (arg3 === null) {
        this.#query += `${column} IS NULL`;
        return;
      }

      if (typeof arg3 === 'number') {
        this.#query += `${column} ${operator_} ${bind ? '?' : arg3}`;
        if (bind) this.#bindings.push(`${arg3}`);
        return;
      }

      this.#query += `${column} ${operator_} ${bind ? '?' : arg3}`;
      if (bind) this.#bindings.push(arg3 as string);
      return;
    }

    if (arg2 === null) {
      this.#query += `${column} IS NULL`;
      return;
    }

    if (typeof arg2 === 'number') {
      this.#query += `${column} = ${bind ? '?' : arg2}`;
      if (bind) this.#bindings.push(`${arg2}`);
      return;
    }

    this.#query += `${column} = ${bind ? '?' : arg2}`;
    if (bind) this.#bindings.push(arg2 as string);
  }

  /**
   * Is Operator
   * @param {null | number | string} operator_
   * @returns 
   */
  #isOperator(operator_: null | number | string): boolean {
    if (typeof operator_ !== 'string') return false;
    const operators: string[] = ['=', '!=', '<=', '>=', '<', '>', 'IN', 'BETWEEN', 'LIKE', '<>'];
    if (operators.includes(operator_)) return true;
    return false;
  }

  /**
   * Alter Table
   * @param {string} tableName 
   * @param {CallableFunction} condition 
   */
  async alertTable(tableName: string, condition: CallableFunction): Promise<void> {
    this.#query = `ALTER TABLE ${tableName} `;
    condition(this);
    for (let i = 0; this.#columns.length > i; i++) {
      if (i > 0) this.#query += ', ';
      this.#query += this.#columns[i];
    }

    if (this.#indexes.length) this.#query += ', ';
    for (let i = 0; this.#indexes.length > i; i++) {
      if (i > 0) this.#query += ', ';
      this.#query += this.#indexes[i];
    }

    await this.exec();
  }

  /**
   * Column
   * @param {string} name 
   * @param {string} type 
   * @param {null | boolean | number | string} default_ 
   * @param {null | string} after 
   * @param {null | string} collation 
   */
  column(name: string, type: string,
    default_: null | boolean | number | string = false,
    after: null | string = null,
    collation: null | string = null): void {

    let query: string = `${name} ${type}`;
    const isAlter: boolean = this.#query.startsWith('ALTER');
    if (isAlter) query = `ADD COLUMN ${name} ${type}`;
    if (default_ === null) {
      query += ' DEFAULT NULL';
    } else if (typeof default_ === 'boolean') {
      query += ` ${default_ ? 'DEFAULT NULL' : 'NOT NULL'}`;
    } else if (typeof default_ === 'number') {
      query += ` NOT NULL DEFAULT ${default_}`;
    } else if (typeof default_ === 'string') {
      if (default_ === 'CURRENT_TIMESTAMP') {
        query += ' NOT NULL DEFAULT CURRENT_TIMESTAMP';
      } else {
        query += ` NOT NULL DEFAULT '${default_}'`;
      }
    }

    if (collation) query += ` COLLATE ${collation}`;
    if (after) query += ` AFTER ${after}`;
    this.#columns.push(query);
  }

  /**
   * Create Table
   * @param {string} tableName
   * @param {CallableFunction} condition 
   */
  async createTable(tableName: string, condition: CallableFunction): Promise<void> {
    this.#query += `CREATE TABLE ${tableName} (`;
    condition(this);
    for (let i = 0; this.#columns.length > i; i++) {
      if (i > 0) this.#query += ', ';
      this.#query += this.#columns[i];
    }

    if (this.#indexes.length) this.#query += ', ';
    for (let i = 0; this.#indexes.length > i; i++) {
      if (i > 0) this.#query += ', ';
      this.#query += this.#indexes[i];
    }

    this.#query += ')';
    await this.exec();
  }

  /**
   * Delete
   * @returns
   */
  delete_(): MySQLQuery {
    this.#query = `DELETE FROM ${this.#tableName}`;
    return this;
  }

  /**
   * Distinct
   * @param {Array} args
   * @returns 
   */
  distinct(args: string[] = []): MySQLQuery {
    if (!args.length) {
      this.#query = `SELECT DISTINCT * FROM ${this.#tableName}`;
      return this;
    }

    this.#query = `SELECT DISTINCT `;
    for (let i = 0; args.length > i; i++) {
      if (i > 0) this.#query += ', ';
      this.#query += args[i];
    }

    this.#query += ` FROM ${this.#tableName}`;
    return this;
  }

  /**
   * Drop Column
   * @param {string} name 
   * @param {Array} args 
   */
  dropColumn(name: string, args: string[] = []): void {
    let query: string = `DROP COLUMN ${name}`;
    for (let i = 0; args.length > i; i++) {
      query += ` ${args[i]}`;
    }

    this.#columns.push(query);
  }

  /**
   * Drop Constraint
   * @param {string} name 
   */
  dropConstraint(name: string): void {
    this.#query += `DROP CONSTRAINT ${name}`;
  }

  /**
   * Drop index
   * @param {string} name 
   */
  dropIndex(name: string): void {
    this.#query += `DROP INDEX ${name}`;
  }

  /**
   * Drop Table
   * @param {string} name 
   * @param {Array} args 
   */
  async dropTable(name: string, args: string[] = []): Promise<void> {
    this.#query = `DROP TABLE IF EXISTS ${name}`;
    for (let i = 0; args.length > i; ++i) {
      this.#query += ` ${args[i]}`;
    }

    await this.exec();
  }

  /**
   * Exec
   * @param {null | string} query 
   * @param {Array} bindings 
   * @returns 
   */
  async exec(query: null | string = null, bindings: string[] = []): Promise<MySQLRes> {
    let res: MySQLRes = [];
    if (query) {
      console.log(query);
      res = await this.#callback(query, bindings);
    } else {
      console.log(this.#query);
      res = await this.#callback(this.#query, this.#bindings);
    }

    this.#hasHaving = false;
    this.#hasOn = false;
    this.#hasWhere = false;

    this.#bindings = [];
    this.#tableName = '';
    this.#columns = [];
    this.#indexes = [];
    this.#query = '';

    return res;
  }

  /**
   * Foreign Key Checks
   * @param {boolean} on 
   * @returns 
   */
  async foreignKeyChecks(on: boolean = true): Promise<void> {
    if (on) {
      await this.exec("SET foreign_key_checks = 1;");
      return;
    }

    await this.exec("SET foreign_key_checks = 0;");
  }

  /**
   * Get UUID
   * @returns 
   */
  getUuid(): string {
    return this.#getUuIdCallback();
  }

  /**
   * Group By
   * @param {string} args 
   * @returns 
   */
  groupBy(args: string[] = []): MySQLQuery {
    this.#query += ` GROUP BY `;
    for (let i = 0; args.length > i; i++) {
      if (i > 0) this.#query += ', ';
      this.#query += args[i];
    }

    return this;
  }

  /**
   * Having
   * @param {string | CallableFunction} arg1 
   * @param {null | number | string} arg2 
   * @param {null | number | string} arg3 
   * @returns 
   */
  having(arg1: string | CallableFunction,
    arg2: null | number | string,
    arg3: null | number | string = null): MySQLQuery {

    if (typeof arg1 === 'function') {
      if (this.#hasHaving) {
        const hasCondition: boolean = this.#query.endsWith(')');
        if (hasCondition) this.#query += ' AND ';
      } else {
        this.#query += ' HAVING ';
        this.#hasHaving = true;
      }

      this.#query += '(';
      arg1(this);
      this.#query += ')';
      return this;
    }

    if (this.#hasHaving) {
      const hasCondition: boolean = this.#query.endsWith('?');
      if (hasCondition) this.#query += ' AND ';
    } else {
      this.#query += ' HAVING ';
      this.#hasHaving = true;
    }

    this.#condition(true, arg1, arg2, arg3);
    return this;
  }

  /**
   * Insert
   * @param {object} args 
   * @returns 
   */
  async insert(args: { [key: string]: any }): Promise<MySQLRes> {
    this.#query = `INSERT INTO ${this.#tableName}`;
    let columns: string = '';
    let values: string = '';

    let first: boolean = true;
    for (const key in args) {
      if (first) {
        first = false;
      } else {
        columns += ', ';
        values += ', ';
      }

      columns += key;
      if (args[key] === null) {
        values += 'NULL';
        continue;
      }

      if (typeof args[key] === 'number') {
        this.#bindings.push(`${args[key]}`);
        values += `?`;
        continue;
      }

      if (typeof args[key] === 'string') {
        this.#bindings.push(args[key] as string);
        values += `?`;
        continue;
      }
    }

    this.#query += ` (${columns}) VALUES (${values})`;
    return this.exec();
  }

  /**
   * Index
   * @param {string} type 
   * @param {Array} args 
   */
  index(type: string, args: string[] = []): void {
    let query: string = `${type} idx`;
    const isAlter: boolean = this.#query.startsWith('ALTER');
    if (isAlter) query = `ADD ${type} idx`;

    for (let i = 0; args.length > i; ++i) {
      query += `_${args[i]}`;
    }

    query += ' (';
    for (let i = 0; args.length > i; ++i) {
      if (i > 0) query += ', ';
      query += args[i];
    }

    query += ')';
    this.#indexes.push(query);
  }

  /**
   * Join
   * @param {string} tableName 
   * @returns 
   */
  join(tableName: string): MySQLQuery {
    this.#query += ` JOIN ${tableName}`;
    return this;
  }

  /**
   * Limit
   * @param {number} limit_ 
   * @param {number} offset 
   * @returns 
   */
  async limit(limit_: number, offset: number = 0): Promise<MySQLRes> {
    if (offset > 0) {
      this.#query += ` LIMIT ${offset}, ${limit_}`;
      return this.exec();
    }

    this.#query += ` LIMIT ${limit_}`;
    return this.exec();
  }

  /**
   * Left Join
   * @param {string} tableName 
   * @returns 
   */
  leftJoin(tableName: string): MySQLQuery {
    this.#query += ` LEFT JOIN ${tableName}`;
    return this;
  }

  /**
   * Offset
   * @param {string} offset 
   * @returns 
   */
  offset(offset: number): MySQLQuery {
    this.#query += ` OFFSET ${offset}`;
    return this;
  }

  /**
   * On
   * @param {string | CallableFunction} arg1 
   * @param {null | number | string} arg2 
   * @param {null | number | string} arg3 
   * @returns 
   */
  on(arg1: string | CallableFunction,
    arg2: null | number | string,
    arg3: null | number | string = null): MySQLQuery {
    if (typeof arg1 === 'function') {
      if (this.#hasOn) {
        const hasCondition: boolean = this.#query.endsWith(')');
        if (hasCondition) this.#query += ' AND ';
      } else {
        this.#query += ' ON ';
        this.#hasOn = true;
      }

      this.#query += '(';
      arg1(this);
      this.#query += ')';
      return this;
    }

    if (this.#hasOn) {
      const hasCondition: boolean = this.#query.endsWith('?');
      if (hasCondition) this.#query += ' AND ';
    } else {
      this.#query += ' ON ';
      this.#hasOn = true;
    }

    this.#condition(false, arg1, arg2, arg3);
    return this;
  }

  /**
   * On Query
   * @param callback 
   */
  onQuery(callback: (query: string, bindings: string[]) => Promise<MySQLRes>): void {
    this.#callback = callback;
  }

  /**
   * Order By
   * @param {string} column 
   * @param {string} arg2 
   * @returns 
   */
  orderBy(column: string, arg2: string): MySQLQuery {
    this.#query += ` ORDER BY ${column} ${arg2}`;
    return this;
  }

  /**
   * Or Having
   * @param {string | CallableFunction} arg1 
   * @param {null | number | string} arg2 
   * @param {null | number | string} arg3 
   * @returns 
   */
  orHaving(arg1: string | CallableFunction,
    arg2: null | number | string,
    arg3: null | number | string = null): MySQLQuery {
    if (typeof arg1 === 'function') {
      if (this.#hasHaving) {
        const hasCondition: boolean = this.#query.endsWith(')');
        if (hasCondition) this.#query += ' OR ';
      } else {
        this.#query += ' HAVING ';
        this.#hasHaving = true;
      }

      this.#query += '(';
      arg1(this);
      this.#query += ')';
      return this;
    }

    if (this.#hasHaving) {
      const hasCondition: boolean = this.#query.endsWith('?');
      if (hasCondition) this.#query += ' OR ';
    } else {
      this.#query += ' HAVING ';
      this.#hasHaving = true;
    }

    this.#condition(true, arg1, arg2, arg3);
    return this;
  }

  /**
   * Or On
   * @param {string | CallableFunction} arg1 
   * @param {null | number | string} arg2 
   * @param {null | number | string} arg3 
   * @returns 
   */
  orOn(arg1: string | CallableFunction,
    arg2: null | number | string,
    arg3: null | number | string = null): MySQLQuery {
    if (typeof arg1 === 'function') {
      if (this.#hasOn) {
        const hasCondition: boolean = this.#query.endsWith(')');
        if (hasCondition) this.#query += ' OR ';
      } else {
        this.#query += ' ON ';
        this.#hasOn = true;
      }

      this.#query += '(';
      arg1(this);
      this.#query += ')';
      return this;
    }

    if (this.#hasOn) {
      const hasCondition: boolean = this.#query.endsWith('?');
      if (hasCondition) this.#query += ' OR ';
    } else {
      this.#query += ' ON ';
      this.#hasOn = true;
    }

    this.#condition(false, arg1, arg2, arg3);
    return this;
  }

  /**
   * Or Where
   * @param {string | CallableFunction} arg1 
   * @param {null | number | string} arg2 
   * @param {null | number | string} arg3 
   * @returns 
   */
  orWhere(arg1: string | CallableFunction,
    arg2: null | number | string,
    arg3: null | number | string = null): MySQLQuery {
    if (typeof arg1 === 'function') {
      if (this.#hasWhere) {
        const hasCondition: boolean = this.#query.endsWith(')');
        if (hasCondition) this.#query += ' OR ';
      } else {
        this.#query += ' WHERE ';
        this.#hasWhere = true;
      }

      this.#query += '(';
      arg1(this);
      this.#query += ')';
      return this;
    }

    if (this.#hasWhere) {
      const hasCondition: boolean = this.#query.endsWith('?')
        || this.#query.endsWith('IS NULL');
      if (hasCondition) this.#query += ' OR ';
    } else {
      this.#query += ' WHERE ';
      this.#hasWhere = true;
    }

    this.#condition(true, arg1, arg2, arg3);
    return this;
  }

  /**
   * Reference
   * @param {string} column 
   * @param {string} tableName 
   * @param {string} foreign 
   * @param {Array} args
   */
  reference(column: string, tableName: string, foreign: string, args: string[] = []): void {
    let query: string = `CONSTRAINT fk_${tableName}_${this.getUuid()} FOREIGN KEY (${column}) `
      + `REFERENCES ${tableName}(${foreign})`;

    const isAlter: boolean = this.#query.startsWith('ALTER');
    if (isAlter) {
      query = `ADD CONSTRAINT fk_${tableName}_${this.getUuid()} FOREIGN KEY (${column}) `
        + `REFERENCES ${tableName}(${foreign})`;
    }

    for (let i = 0; args.length > i; ++i) {
      query += ` ${args[i]}`;
    }

    this.#indexes.push(query);
  }

  /**
   * Right Join
   * @param {string} tableName 
   * @returns 
   */
  rightJoin(tableName: string): MySQLQuery {
    this.#query += ` RIGHT JOIN ${tableName}`;
    return this;
  }

  /**
   * Select
   * @param args 
   * @returns 
   */
  select(args: string[] = []): MySQLQuery {
    if (!args.length) {
      this.#query = `SELECT * FROM ${this.#tableName}`;
      return this;
    }

    this.#query = 'SELECT ';
    for (let i = 0; args.length > i; i++) {
      if (i > 0) this.#query += ', ';
      this.#query += args[i];
    }

    this.#query += ` FROM ${this.#tableName}`;
    return this;
  }

  /**
   * Set GetUuIdCallback
   * @param callback 
   */
  setGetUuIdCallback(callback: () => string): void {
    this.#getUuIdCallback = callback;
  }

  /**
   * Table
   * @param {string} tableName 
   * @returns 
   */
  table(tableName: string): MySQLQuery {
    this.#tableName = tableName;
    return this;
  }

  /**
   * Update
   * @param {object} args 
   * @returns 
   */
  update(args: { [key: string]: any }): MySQLQuery {
    this.#query = 'UPDATE ';
    this.#query += this.#tableName;
    this.#query += ' SET ';

    let first: boolean = true;
    for (const key in args) {
      if (first) {
        first = false;
      } else {
        this.#query += ', ';
      }

      if (args[key] === null) {
        this.#query += `${key} = NULL`;
        continue;
      }

      if (typeof args[key] === 'number') {
        this.#bindings.push(`${args[key]}`);
        this.#query += `${key} = ?`;
        continue;
      }

      if (typeof args[key] === 'string') {
        this.#bindings.push(args[key]);
        this.#query += `${key} = ?`;
        continue;
      }
    }

    return this;
  }

  /**
   * Where
   * @param {string | CallableFunction} arg1 
   * @param {null | number | string} arg2 
   * @param {null | number | string} arg3 
   * @returns 
   */
  where(arg1: string | CallableFunction,
    arg2: null | number | string = null,
    arg3: null | number | string = null): MySQLQuery {
    if (typeof arg1 === 'function') {
      if (this.#hasWhere) {
        const hasCondition: boolean = this.#query.endsWith(')');
        if (hasCondition) this.#query += ' AND ';
      } else {
        this.#query += ' WHERE ';
        this.#hasWhere = true;
      }

      this.#query += '(';
      arg1(this);
      this.#query += ')';
      return this;
    }

    if (this.#hasWhere) {
      const hasCondition: boolean = this.#query.endsWith('?')
        || this.#query.endsWith('IS NULL');
      if (hasCondition) this.#query += ' AND ';
    } else {
      this.#query += ' WHERE ';
      this.#hasWhere = true;
    }

    this.#condition(true, arg1, arg2, arg3);
    return this;
  }
}

export default MySQLQuery;