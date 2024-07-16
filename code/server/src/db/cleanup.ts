"use strict"

import db from "../db/db";

/**
 * Deletes all data from the database.
 * This function must be called before any integration test, to ensure a clean database state for each test run.
 */

//  export async function cleanup(): Promise<void> {
//     return new Promise<void>((resolve, reject) => {
//      db.serialize(() => {
//          // Delete all data from the database.
//          db.run("DELETE FROM users")
//          //Add delete statements for other tables here
//          db.run("DELETE FROM product")
//          db.run("DELETE FROM product_in_cart")
//          db.run("DELETE FROM cart")
//          db.run("DELETE FROM review")
//      })
//      resolve()
//     })
//  }
 export async function cleanup(): Promise<void> {
     return new Promise<void>((resolve, reject) => {
         db.serialize(() => {
             db.run("DELETE FROM users", (err) => {
                 if (err) reject(err);
                 db.run("DELETE FROM product", (err) => {
                     if (err) reject(err);
                     db.run("DELETE FROM product_in_cart", (err) => {
                         if (err) reject(err);
                         db.run("DELETE FROM cart", (err) => {
                            if (err) reject(err);
                             db.run("DELETE FROM review", (err) => {
                                 if (err) reject(err);
                                 resolve();
                             });
                         });
                     });
                 });
             });
         });
     });
 }