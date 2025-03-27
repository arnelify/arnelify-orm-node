#!/usr/bin/env bun

import ArnelifyORMRes from "contracts/res";

/**
 * Arnelify ORM
 */
class ArnelifyORM {

  #hasHaving: boolean = false;
  #hasOn: boolean = false;
  #hasWhere: boolean = false;

  #bindings: string[] = [];
  #tableName: string = '';
  #columns: string[] = [];
  #indexes: string[] = [];
  #query: string = '';

  #lib: any = null;

  constructor(opts: {[key: string]: number | string}) {
    this.#lib = require('../build/Release/arnelify-orm.node');
    this.#lib.orm_create(JSON.stringify(opts));
  }

  /**
   * Condition
   * @param {string} column
   * @param {null | number | string} arg2 
   * @param {null | number | string} arg3 
   * @returns 
   */
  #condition(column: string,
    arg2: null | number | string,
    arg3: null | number | string = null): void {
    if (this.#isOperator(arg2)) {
      const operator_: string = String(arg2);
      if (arg3 === null) {
        this.#query += `${column} IS NULL`;
        return;
      }

      if (typeof arg3 === 'number') {
        this.#query += `${column} ${operator_} ${arg3}`;
        this.#bindings.push(`${arg3}`);
        return;
      }

      this.#query += `${column} ${operator_} ?`;
      this.#bindings.push(arg3 as string);
      return;
    }

    if (arg2 === null) {
      this.#query += `${column} IS NULL`;
      return;
    }

    if (typeof arg2 === 'number') {
      this.#query += `${column} = ?`;
      this.#bindings.push(`${arg2}`);
      return;
    }

    this.#query += `${column} = ?`;
    this.#bindings.push(arg2 as string);
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
  alertTable(tableName: string, condition: CallableFunction): void {
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

    this.exec();
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
  createTable(tableName: string, condition: CallableFunction): void {
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
    this.exec();
  }

  /**
   * Delete
   * @returns
   */
  delete_(): ArnelifyORM {
    this.#query = `DELETE FROM ${this.#tableName}`;
    return this;
  }

  /**
   * Destroy
   */
  destroy(): void {
    this.#lib.orm_destroy();
  }

  /**
   * Distinct
   * @param {Array} args
   * @returns 
   */
  distinct(args: string[] = []): ArnelifyORM {
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
  dropTable(name: string, args: string[] = []) {
    this.raw('SET foreign_key_checks = 0;');
    this.#query = `DROP TABLE IF EXISTS ${name}`;
    for (let i = 0; args.length > i; ++i) {
      this.#query += ` ${args[i]}`;
    }

    this.exec();
    this.raw('SET foreign_key_checks = 1;');
  }

  /**
   * Exec
   * @param {null | string} query 
   * @param {Array} bindings 
   * @returns 
   */
  exec(query: null | string = null, bindings: string[] = []): ArnelifyORMRes {
    let serialized: string = '';
    if (!query) {
      serialized = this.#lib.orm_exec(this.#query, JSON.stringify(this.#bindings));
    } else {
      serialized = this.#lib.orm_exec(query, bindings);
    }

    this.#hasHaving = false;
    this.#hasOn = false;
    this.#hasWhere = false;

    this.#bindings = [];
    this.#tableName = '';
    this.#columns = [];
    this.#indexes = [];
    this.#query = '';

    let res: ArnelifyORMRes = {};
    try {
      res = JSON.parse(serialized);
    } catch(err) {
      this.#logger('Res must be a valid JSON.', true);
    }

    return res;
  }

  /**
   * getUuid
   * @returns
   */
  getUuid(): string {
    return this.#lib.orm_get_uuid();
  }

  /**
   * Group By
   * @param {string} args 
   * @returns 
   */
  groupBy(args: string[] = []): ArnelifyORM {
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
    arg3: null | number | string = null): ArnelifyORM {

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

    this.#condition(arg1, arg2, arg3);
    return this;
  }

  /**
   * Insert
   * @param {object} args 
   * @returns 
   */
  insert(args: { [key: string]: any }): { [key: string]: string } {
    this.#query = `INSERT INTO ${this.#tableName}`;
    let columns: string = '';
    let values: string = '';

    let first: boolean = true;
    for (const key in args) {
      if (!first) {
        columns += ', ';
        values += ', ';
        first = false;
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
  join(tableName: string): ArnelifyORM {
    this.#query += ` JOIN ${tableName}`;
    return this;
  }

  /**
   * Limit
   * @param {number} limit_ 
   * @param {number} offset 
   * @returns 
   */
  limit(limit_: number, offset: number = 0): ArnelifyORMRes {
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
  leftJoin(tableName: string): ArnelifyORM {
    this.#query += ` LEFT JOIN ${tableName}`;
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
    arg3: null | number | string = null): ArnelifyORM {
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

    this.#condition(arg1, arg2, arg3);
    return this;
  }

  /**
   * Offset
   * @param {string} offset 
   * @returns 
   */
  offset(offset: number): ArnelifyORM {
    this.#query += ` OFFSET ${offset}`;
    return this;
  }

  /**
   * Order By
   * @param {string} column 
   * @param {string} arg2 
   * @returns 
   */
  orderBy(column: string, arg2: string): ArnelifyORM {
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
    arg3: null | number | string = null): ArnelifyORM {
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

    this.#condition(arg1, arg2, arg3);
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
    arg3: null | number | string = null): ArnelifyORM {
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

    this.#condition(arg1, arg2, arg3);
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
    arg3: null | number | string = null): ArnelifyORM {
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
      const hasCondition: boolean = this.#query.endsWith('?');
      if (hasCondition) this.#query += ' OR ';
    } else {
      this.#query += ' WHERE ';
      this.#hasWhere = true;
    }

    this.#condition(arg1, arg2, arg3);
    return this;
  }

  /**
   * Raw
   * @param {string} query 
   * @returns 
   */
  raw(query: string): { [key: string]: string } {
    this.#query = query;
    return this.exec();
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
  rightJoin(tableName: string): ArnelifyORM {
    this.#query += ` RIGHT JOIN ${tableName}`;
    return this;
  }

  /**
   * Select
   * @param args 
   * @returns 
   */
  select(args: string[] = []): ArnelifyORM {
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
   * Table
   * @param {string} tableName 
   * @returns 
   */
  table(tableName: string): ArnelifyORM {
    this.#tableName = tableName;
    return this;
  }
  
  /**
   * To JSON
   * @param {object} res 
   * @returns 
   */
  toJson(res: {[key: string]: string}) {
    return JSON.stringify(res);
  }

  /**
   * Update
   * @param {object} args 
   * @returns 
   */
  update(args: {[key: string]: any}): ArnelifyORM {
    let columns: string = '';

    this.#query = 'UPDATE ';
    this.#query += this.#tableName;
    this.#query += ' SET ';

    let first: boolean = true;
    for (const key in args) {
      if (!first) {
        this.#query += ', ';
        first = false;
      }

      if (args[key] === null) {
        this.#query += `${key} IS NULL`;
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
    arg3: null | number | string = null): ArnelifyORM {
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
        const hasCondition: boolean = this.#query.endsWith('?');
        if (hasCondition) this.#query += ' AND ';
      } else {
        this.#query += ' WHERE ';
        this.#hasWhere = true;
      }
  
      this.#condition(arg1, arg2, arg3);
      return this;
    }
}

export type { ArnelifyORMRes };
export { ArnelifyORM };