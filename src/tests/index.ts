#!/usr/bin/env bun

import { MySQL, MySQLQuery, MySQLRes } from "../index";

(async function main(): Promise<number> {

  const db: MySQL = new MySQL({
    "ORM_MAX_CONNECTIONS": 10,
    "ORM_HOST": "mysql",
    "ORM_NAME": "test",
    "ORM_USER": "root",
    "ORM_PASS": "pass",
    "ORM_PORT": 3306
  });

  let res: MySQLRes = [];

  await db.connect();
  console.log('Connected.');

  await db.foreignKeyChecks(false);
  await db.dropTable("users");
  await db.dropTable("posts");
  await db.foreignKeyChecks(true);

  await db.createTable("users", (query: MySQLQuery): void => {
    query.column("id", "BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY");
    query.column("email", "VARCHAR(255) UNIQUE", null);
    query.column("created_at", "DATETIME", "CURRENT_TIMESTAMP");
    query.column("updated_at", "DATETIME", null);
  });

  await db.createTable("posts", (query: MySQLQuery): void => {
    query.column("id", "BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY");
    query.column("user_id", "BIGINT UNSIGNED", null);
    query.column("contents", "VARCHAR(2048)", null);
    query.column("created_at", "DATETIME", "CURRENT_TIMESTAMP");
    query.column("updated_at", "DATETIME", "CURRENT_TIMESTAMP");

    query.index("INDEX", ["user_id"]);
    query.reference("user_id", "users", "id", ["ON DELETE CASCADE"]);
  });

  res = await db.table("users").insert({
    email: "email@example.com"
  });

  const insert: string = db.toJson(res);
  console.log(`last inserted id: ${insert}`);

  res = await db.table("users")
    .select(["id", "email"])
    .where("id", 1)
    .limit(1);

  const select: string = db.toJson(res);
  console.log(`Inserted row: ${select}`);

  await db.table("users")
    .update({
      email: "user@example.com"
    }).where("id", 1)
    .limit(1);

  await db.table("users")
    .delete_()
    .where("id", 1)
    .limit(1);

  await db.close();
  console.log('Closed.');

  return 0;

})();