import {
  ProductNotFoundError,
  WrongParameterError,
  SellingDateError,
  LowProductStockError,
  ProductSoldError,
  ProductAlreadyExistsError,
  ChangeDateError,
} from "../errors/productError";
import { Product } from "../components/product";
import db from "../db/db";
import { param } from "express-validator";
/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {
  registerProducts(
    model: string,
    category: string,
    quantity: number,
    details: string | null,
    sellingPrice: number,
    arrivalDate: string
  ): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const today = new Date().setHours(0,0,0,0)
        const arrival = new Date(arrivalDate).setHours(0,0,0,0)
        if(arrival > today) {
          reject(new SellingDateError())
          return
      }
      console.log("entered in registerProductDao")
        const sql =
          "INSERT INTO product(model, category, quantity, details, sellingPrice, arrivalDate) VALUES(?, ?, ?, ?, ?, ?)";
        db.run(
          sql,
          [model, category, quantity, details, sellingPrice, arrivalDate],
          (err: Error | null) => {
            console.log("entered in insert Method. Error: " + err)
            if (err) {
              if (err.message.includes("UNIQUE constraint failed: product.model")) reject(new ProductAlreadyExistsError())
              reject(err)
          }
            resolve(true);
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }
  changeProductQuantity(
    model: string,
    newQuantity: number,
    changeDate: string
  ): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      try {
        const sql =
          "SELECT model, category, quantity, details, sellingPrice, arrivalDate FROM product WHERE model = ?";
        db.get(sql, [model], (err: Error | null, row: Product) => {
          if (err) {
            reject(err);
            return;
          }
          if (!row) {
            reject(new ProductNotFoundError());
            return;
          }
          const arrivalDateDt = new Date(row.arrivalDate);
          let changeDateDt: Date;
          // if (changeDate == null || changeDate == "") {
            // changeDate = new Date().toISOString().substring(0, 10);
            // changeDateDt = new Date(changeDate);
          // }
          // else{
            changeDateDt = new Date(changeDate);
            if(changeDateDt > new Date()){
              reject(new ChangeDateError());
              return;  
            }
          //}
          if(changeDateDt < arrivalDateDt){
            reject(new ChangeDateError());
            return; 
          }

          let finalQt = newQuantity + row.quantity;
          const sql =
            "UPDATE product SET quantity = ? WHERE model = ?";
          db.run(sql, [finalQt, model], (err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(finalQt);
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  sellProduct(
    model: string,
    quantity: number,
    sellingDate: string
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        const sql =
          "SELECT model, category, quantity, details, sellingPrice, arrivalDate FROM product WHERE model = ?";
        db.get(sql, [model], (err: Error | null, row: Product) => {
          if (err) {
            reject(err);
            return;
          }
          if (!row) {
            reject(new ProductNotFoundError());
            return;
          }
          let sellingDateDt = new Date(sellingDate);
          if (sellingDateDt > new Date()) {
            reject(new SellingDateError());
            return;
          }
          if (sellingDateDt < new Date(row.arrivalDate)) {
            reject(new SellingDateError());
            return;
          }
          if (row.quantity == 0) {
            reject(new ProductSoldError());
            return;
          }
          if (row.quantity < quantity) {
            reject(new LowProductStockError());
            return;
          }
          const sql =
            "UPDATE product SET quantity = ?, sellingDate = ? WHERE model = ?";
          db.run(sql, [row.quantity - quantity, sellingDate, model], (err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  getProducts(
    grouping: string | null,
    category: string | null,
    model: string | null
  ): Promise<Product[]> {
    return new Promise<Product[]>((resolve, reject) => {
      try {
        console.log("grouping, category, model: ", grouping, category, model);
        let query: string;
        let parameter: string[];
        switch (grouping) {
          case null:
            console.log("entered getProducts. model is " + model + "and category is " + category)
            if (model != null || category != null) {
              reject(new WrongParameterError());
              return;
            }
            query =
              "SELECT model, category, quantity, details, sellingPrice, arrivalDate FROM product";
            parameter = [];
            break;

          case "category":
            if (model != null || category == null) {
              reject(new WrongParameterError());
              return;
            }
            query =
              "SELECT model, category, quantity, details, sellingPrice, arrivalDate FROM product WHERE category = ?";
            parameter = [category];
            break;

          case "model":
            if (!model || !!category) {
              reject(new WrongParameterError());
              return;
            }
            query =
              "SELECT model, category, quantity, details, sellingPrice, arrivalDate FROM product WHERE model = ?";
            parameter = [model];
            break;
          default:
            reject(new WrongParameterError());
            return;
        }

        db.all(query, parameter, (err: Error | null, rows: Product[]) => {
          if (err) {
            console.log("Errore");
            reject(err);
            return;
          }
          if ((!rows || rows.length == 0) && grouping == 'model') {
            reject(new ProductNotFoundError());
            return;
          }
          // console.log("ho i prodotti: ", rows);
          const products = rows.map(
            (row) =>
              new Product(
                row.model,
                row.category,
                row.quantity,
                row.details,
                row.sellingPrice,
                row.arrivalDate
              )
          );
          resolve(products);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  getAvailableProducts(
    grouping: string | null,
    category: string | null,
    model: string | null
  ): Promise<Product[]> {
    return new Promise<Product[]>((resolve, reject) => {
      try {
        // const sql =
        // "SELECT model, category, quantity, details, sellingPrice, arrivalDate FROM product WHERE quantity > 0 AND (category = ? OR model = ?)";
        let sql: string;
        let parameters: string[];
        console.log(
          "call to available products - grouping, category, model:" +
            grouping +
            ", " +
            category +
            ", " +
            model
        );
        switch (grouping) {
          case null:
            if (model != null || category != null) {
              reject(new WrongParameterError());
              return;
            }
            sql =
              "SELECT model, category, quantity, details, sellingPrice, arrivalDate FROM product WHERE quantity > 0";
            parameters = [];
            break;

          case "category":
            if (model != null || category == null) {
              reject(new WrongParameterError());
              return;
            }
            sql =
              "SELECT model, category, quantity, details, sellingPrice, arrivalDate FROM product WHERE quantity > 0 AND category = ?";
            parameters = [category];
            break;

          case "model":
            if (model == null || category != null) {
              reject(new WrongParameterError());
              return;
            }
            sql =
              "SELECT model, category, quantity, details, sellingPrice, arrivalDate FROM product WHERE model = ?";
            parameters = [model];
            break;
          default:
            reject(new WrongParameterError());
            return;
        }

        db.all(sql, parameters, (err: Error | null, rows: Product[]) => {
          if (err) {
            reject(err);
            return;
          }
          //if the model doesn't exist throws error
          if ((!rows || rows.length==0) && grouping=="model") {
            reject(new ProductNotFoundError());
            return;
          }
          //if the model exists but qtAvailable==0, return []
          if(grouping=="model"){
            if(rows[0].quantity==0){
              resolve([]);
            }
          }
          const products = rows.map(
            (row) =>
              new Product(
                row.model,
                row.category,
                row.quantity,
                row.details,
                row.sellingPrice,
                row.arrivalDate
              )
          );
          resolve(products);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  deleteAllProducts(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const sql = "DELETE FROM product";
      db.run(sql, [], (err) => {
        if (err) {
          reject(err);
        } else {
          const updateCartSql = "UPDATE cart SET total = 0"; 
          db.run(updateCartSql, [], (err) => {
          if (err) {
            reject(err);
          } else {
          resolve(true);
          }
      });
        }

      });
    });
  }
  deleteProduct(model: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        // remove product from product table (if exists)
        const sql =
          "SELECT category, quantity, sellingPrice FROM product WHERE model = ?";
        db.get(sql, [model], (err: Error | null, row: any) => {
          if (err) {
            reject(err);
            return;
          } else if (!row) {
            reject(new ProductNotFoundError());
            return;
          } else {
            const selectCartsSql  = "SELECT cart_id,quantity FROM product_in_cart WHERE model = ?";
            db.all(selectCartsSql,[model],(err: Error | null, rows: any[]) => {
              if (err) {
                reject(err);
                return;
              }
              if(rows.length != 0){
                rows.forEach(async product_in_cart => {
                  await this.updateCartTotal(product_in_cart.quantity,row.sellingPrice,product_in_cart.cart_id).then().catch( err => {
                    reject(err)
                    return
                })
                })
              }
             const sql = "DELETE FROM product WHERE model = ?"
             db.run(sql, [model], (err) => {
               if (err) {
                 reject(err);
               } else {
                 resolve(true);
               }
             });
            })
          }
        });
      } catch (err) {
        reject(err);
        return;
      }
    });
  }

   updateCartTotal( quantity: number, price: number, cartId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const amount = price * quantity
      const updateCartSql = "UPDATE cart SET total = total - ? WHERE id = ?"; 
      db.run(updateCartSql, [amount,cartId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

}

export default ProductDAO;
