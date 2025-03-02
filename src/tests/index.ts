#!/usr/bin/env bun

import ArnelifyORMRes from "contracts/res";
import ArnelifyORM from "../index";

(function main(): number {

  const db: ArnelifyORM = new ArnelifyORM({
    "ORM_DRIVER": "mysql",
    "ORM_HOST": "mysql",
    "ORM_NAME": "test",
    "ORM_USER": "root",
    "ORM_PASS": "pass",
    "ORM_PORT": 3306
  });
  
  let res: ArnelifyORMRes = {};

  db.dropTable("users");
  db.dropTable("posts");

  db.createTable("users", (query: ArnelifyORM): void => {
    query.column("id", "BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY");
    query.column("email", "VARCHAR(255) UNIQUE", null);
    query.column("created_at", "DATETIME", "CURRENT_TIMESTAMP");
    query.column("updated_at", "DATETIME", null);
  });

  db.createTable("posts", (query: ArnelifyORM): void => {
    query.column("id", "BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY");
    query.column("user_id", "BIGINT UNSIGNED", null);
    query.column("contents", "VARCHAR(2048)", null);
    query.column("created_at", "DATETIME", "CURRENT_TIMESTAMP");
    query.column("updated_at", "DATETIME", "CURRENT_TIMESTAMP");

    query.index("INDEX", ["user_id"]);
    query.reference("user_id", "users", "id", ["ON DELETE CASCADE"]);
  });

  res = db.table("users").insert({
    email: "email@example.com"
  });

  const insert: string = db.toJson(res);
  console.log(`last inserted id: ${insert}`);

  res = db.table("users")
    .select(["id", "email"])
    .where("id", 1)
    .limit(1);

  const select: string = db.toJson(res);
  console.log(`Inserted row: ${select}`);

  db.table("users")
    .update({
      email: "user@example.com"
    }).where("id", 1)
    .limit(1);

  db.table("users")
    .delete_()
    .where("id", 1)
    .limit(1);

  return 0;

})();