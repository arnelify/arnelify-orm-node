#!/usr/bin/env bun

import MySQL from "./mysql";
import MySQLQuery from "./mysql/query";

import MySQLRes from "contracts/res";

export type { MySQLRes };
export { MySQL, MySQLQuery };