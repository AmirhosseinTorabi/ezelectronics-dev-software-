import db from "../db/db"
import { User, Role } from "../components/user"
import { Cart, ProductInCart } from "../components/cart"
import { ProductNotFoundError, EmptyProductStockError, LowProductStockError } from "../errors/productError"
import { CartNotFoundError, EmptyCart404Error, EmptyCartError, ProductNotInCartError } from "../errors/cartError"
import { BlockList } from "net"
import { rejects } from "assert"
/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {

        getCurrentCart(user: User): Promise<Cart> {
            return new Promise<Cart>( (resolve,reject ) => {
                try{
                    const sql = "SELECT product.model, product_in_cart.quantity, category, sellingPrice, total FROM product_in_cart, cart, product WHERE product_in_cart.cart_id = cart.id AND cart.paid = 'false' AND cart.username = ? AND product.model = product_in_cart.model"
                    db.all(sql, [user.username], (err: Error | null, rows: any[]) => {
                        if (err) {
                            reject(err)
                            return
                        }
                        let price: number
                        if (!rows || rows.length == 0) {
                          price = 0  
                        }else{
                            price = rows[0].total
                        }
                        const products: ProductInCart[] = rows.map(row =>new ProductInCart (
                            row.model,
                            row.quantity,
                            row.category,
                            row.sellingPrice
                          ));
                        const cart = new Cart(user.username,false,null,price, products)
                        resolve(cart)                        
                    })
                }catch(err){
                    reject(err)
                }
            })
        }

        addProduct(user: User, product: string): Promise<boolean>{
            return new Promise<boolean> ( (resolve,reject )=> {
                try {
                    console.log("product to add: ",product)
                    const verifyProductExistanceAndStocks = "SELECT category, quantity, sellingPrice FROM product WHERE model = ?"
                    db.get(verifyProductExistanceAndStocks, [product], (err: Error | null, row: any) => {
                        if (err) {
                            reject(err)
                            return
                        }
                        if (!row) {
                            reject(new ProductNotFoundError())
                            return
                        }
                        if (row.quantity == 0){
                            reject(new EmptyProductStockError())
                            return
                        }
                        console.log("product to add found in the db")
                        let selling_price = row.sellingPrice
                        const getProductQtInCurrentUnpaidCart = "SELECT c.id as cartId, COUNT(pic.model) as productCount FROM cart c LEFT JOIN product_in_cart pic ON c.id = pic.cart_id AND pic.model = ? WHERE c.username = ? AND c.paid = 'false' GROUP BY c.id ORDER BY c.id;"
                        db.get(getProductQtInCurrentUnpaidCart, [product,user.username], (err: Error | null, row: any) => {
                            if(err){
                                reject(err)
                                return
                            }
                            if(!row){//no unpaid cart
                                console.log("cart does not exists")
                                const cart_insert = "INSERT INTO cart(payment_date,paid,total,username) VALUES('null','false',?,?)"
                                db.run(cart_insert, [selling_price,user.username], function (err) {
                                    if (err) {
                                        reject(err);
                                    } 
                                    const lastCart = this.lastID
                                    const sql = "INSERT INTO product_in_cart(cart_id,model,quantity) VALUES(?,?,1)"
                                    db.run(sql, [lastCart,product], function (err) {
                                        console.log("entered second run product does not exists. Error = " + err)
                                        if(err){
                                            reject(err)
                                            return
                                        }
                                        console.log("entered second run product does not exists and error not thrown")
                                        resolve(true)
                                    })
                                }) 
                            }else{// cart found, have to updated
                                console.log("cart found in the db")
                                let cartId = row.cartId
                                if(row.productCount == 0){// not in cart

                                    const sql = "INSERT INTO product_in_cart(cart_id,model,quantity) VALUES(?,?,1)"
                                    db.run(sql, [cartId,product], function (err) {
                                        if(err){
                                            reject(err)
                                            return
                                        }
                                        const sql = "UPDATE cart SET total = total + ? WHERE id = ?"
                                        db.run(sql, [selling_price,cartId], function (err) {
                                            if(err){
                                                reject(err)
                                                return
                                            }
                                            resolve(true)
                                        })
                                        
                                    })
                                }else{ //already in cart
                                    console.log("product already in cart")
                                    const sql = "UPDATE product_in_cart SET quantity = quantity + 1 WHERE cart_id = ? AND model = ?"
                                    db.run(sql, [cartId,product], function (err) {
                                        if(err){
                                            console.log("error increasing already in cart: ",err)
                                            reject(err)
                                            return
                                        }
                                        const sql = "UPDATE cart SET total = total + ? WHERE id = ?"
                                        db.run(sql, [selling_price,cartId], function (err) {
                                            if(err){
                                                console.log("error increasing the total of cart: ",err)
                                                reject(err)
                                                return
                                            }
                                            resolve(true)
                                        })
                                        
                                    }) 
                                }
                            }
                        })
                        
                    })
                } catch (error) {
                    reject(error)
                }
            })
        }

        checkoutCart(user: User): Promise<Boolean> {
            return new Promise<Boolean>( (resolve,reject) => {
                try{
                console.log("entro in checkout")
                const sql = "SELECT id FROM cart WHERE username = ? AND paid = 'false'"
                db.get(sql, [user.username], (err: Error | null, cart: any) => {
                    if(err){
                        reject(err)
                        return
                    }
                    if(!cart || cart.length==0){
                        reject(new CartNotFoundError())
                        return
                    }
                    const cartId = cart.id
                    console.log("id cart trovato")
                    const sql = "SELECT p.model, pic.quantity as quantityInCart, p.quantity as stock FROM cart c, product_in_cart pic, product p WHERE c.id = pic.cart_id AND p.model = pic.model AND c.id = ?"
                    db.all(sql, [cartId],  (err: Error | null, result: any[]) => {
                        if(err) {
                            reject(err)
                            return
                        }
                        if(!result || result.length === 0){
                            reject(new EmptyCartError())
                            return
                        }
                        console.log("product found in cart: ",result)
                        for(const product of result){
                            if(product.stock == 0){
                                reject(new EmptyProductStockError())
                                return 
                            }
                            if(product.quantityInCart > product.stock){
                                console.log("error low products stockerror")
                            
                                reject(new LowProductStockError())
                                return
                            }
                        }
                        
                        const sql = "UPDATE cart SET paid = 'true', payment_date = ? WHERE username = ? AND id=?"
                        const today = new Date().toISOString().substring(0, 10);
                        db.run(sql, [today,user.username, cartId], async (err) => {
                            if(err){
                                reject(err)
                                return
                            }
                            console.log("product to change: ",result)
                            result.forEach(async product => {
                                await this.decreaseAfterPurchase(product.model, product.quantityInCart).then().catch( err => {
                                    reject(err)
                                    return
                                })
                            })
                            resolve(true)
                        })
                    })
                })
                } catch(err){

                }
            })
        }

        private decreaseAfterPurchase(model: string, number_paid: number): Promise<Boolean>{
            return new Promise<Boolean>( (resolve,reject) =>{
                console.log("stock: ",model,"decreased by:",number_paid)
                const sql = "UPDATE product SET quantity = quantity - ? WHERE model = ?"
                db.run(sql, [number_paid,model], function (err) {
                    if(err){
                        reject(err)
                        return
                    }
                    resolve(true)
                })
                
            } )
        }

        getCustomerCart(user: User): Promise<Cart[]>{
            return new Promise<Cart[]>( (resolve,reject) => {
                const sql = "SELECT pic.cart_id, c.payment_date, pic.model, pic.quantity, category, p.sellingPrice, total FROM cart c, product_in_cart pic, product p WHERE c.id = pic.cart_id AND c.username = ? AND paid = 'true' AND p.model = pic.model "
                try{
                    db.all(sql, [user.username], (err: Error | null, rows: any[]) => {
                        if (err) {
                            reject(err)
                            return
                        }
                        if (!rows || rows.length == 0) {
                            resolve([])
                            return
                        }
                        //console.log("query superata: ",rows)
                        const total_cart: Cart[] = []
                        let inside_cart: ProductInCart[] = []
                        let currentCart: Cart | null = null;
                        let previous_id = rows[0].cart_id // first statement
                        currentCart = new Cart(user.username, true, rows[0].payment_date, rows[0].total,inside_cart)
                        for(let [index,line] of rows.entries()){
                            if(line.cart_id !== previous_id ){
                                total_cart.push(currentCart)
                                inside_cart = []
                                currentCart = new Cart(user.username, true, line.payment_date, line.total,inside_cart)
                            }
                            currentCart.products.push(new ProductInCart(line.model,line.quantity,line.category,line.sellingPrice))
                            if(index == rows.length - 1){
                                total_cart.push(currentCart)
                            }
                            previous_id = line.cart_id
                        }
                        
                        resolve(total_cart)
                    })
                }catch(err){
                    reject(err)
                }
            })
        }

        // SELECT pic.cart_id, c.username, c.payment_date, pic.model, pic.quantity, category, p.sellingPrice, total FROM cart c, product_in_cart pic, product p WHERE c.id = pic.cart_id AND p.model = pic.model
        getAllCarts(): Promise<Cart[]> {
            return new Promise<Cart[]> ( (resolve,reject) => {
                const sqlCarts = "SELECT id, payment_date, paid, total, username FROM cart oRDER by id ASC"
                try{
                    db.all(sqlCarts, [], (err: Error | null, cartRows: any[]) => {
                        if (err) {
                            reject(err)
                            return
                        }
                        if (!cartRows || cartRows.length == 0) {
                            resolve([])
                            return
                        }
                        const sqlSelectProductIntheCart = "SELECT pic.cart_id, pic.model, p.category, pic.quantity, p.sellingPrice FROM product_in_cart pic JOIN product p ON p.model = pic.model"
                        db.all(sqlSelectProductIntheCart, [], (err: Error | null, picRows: any[]) => {
                            if (err) {
                                reject(err)
                                return
                            }
                            let carts: Cart[] = [];
                            for(let [j, c] of cartRows.entries()){
                                let newCart = new Cart(c.username, this.convertToBoolean(c.paid), c.payment_date === "null" ? null : c.payment_date, c.total, [])
                                for (let [i, pic] of picRows.entries()){
                                    if(c.id==pic.cart_id){
                                        let newProductInCart = new ProductInCart(pic.model, pic.quantity, pic.category, pic.sellingPrice)
                                        newCart.products.push(newProductInCart);
                                    }
                                }
                                carts.push(newCart);
                            }
                            resolve(carts);
    
                        });
                    })
                }catch(err){
                    reject(err)
                }
            })
        }

        private convertToBoolean(toConvert: string): boolean{
            if(toConvert=="true" || toConvert=="True" || toConvert=="1"){
                return true
            }
            else{
                return false;
            }
        }

        removeProductFromCart(user: User, product: string): Promise<Boolean>{
            return new Promise<Boolean> ( (resolve,reject) => {
                try{
                const sql = "SELECT category, quantity, sellingPrice FROM product WHERE model = ?"
                db.get(sql, [product], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!row || row.length==0) {
                        reject(new ProductNotFoundError())
                        return
                    }
                    let price = row.sellingPrice
                    const sqlCartExists = "SELECT id FROM cart WHERE username = ? AND paid='false'"
                    db.get(sqlCartExists, [user.username], (err: Error | null, cartRow: any) => {
                        if (err) {
                            reject(err)
                            return
                        }
                        if(!cartRow){
                            reject(new CartNotFoundError())
                            return
                        }
                        const sqlGetCurrentCart = "SELECT pic.model, pic.quantity, p.sellingPrice FROM product p, product_in_cart pic WHERE p.model = pic.model AND pic.cart_id = ?";
                        let cart_id = cartRow.id;
                        db.all(sqlGetCurrentCart, [cart_id], (err: Error | null, result: any[]) => {
                            if (err) {
                                reject(err)
                                return
                            }
                            //if cart is empty -> error 404
                            if(result.length==0){
                                reject(new EmptyCart404Error())
                                return    
                            }
                            let quantity: number
                            for(let [index,line] of result.entries()){
                                console.log(index)
                                if(line.model === product){
                                    quantity = line.quantity
                                    break
                                }
                                if(index == result.length - 1){
                                    reject(new ProductNotInCartError());
                                    return;
                                }
                            }
                            if(quantity > 1){
                                const sql = "UPDATE product_in_cart SET quantity = quantity - 1 WHERE cart_id = ? AND model = ?"
                                db.run(sql, [cart_id,product], function (err) {
                                    if(err){
                                        reject(err)
                                        return
                                    }
                                    const sql = "UPDATE cart SET total = total - ? WHERE id = ?"
                                    db.run(sql, [price,cart_id], function (err) {
                                        if(err){
                                            reject(err)
                                            return
                                        }
                                        resolve(true)
                                    })
                                
                                })
                            }else{
                                const sql = "DELETE FROM product_in_cart WHERE cart_id = ? AND model = ?"
                                db.run(sql, [cart_id,product], function (err) {
                                    if(err){
                                        reject(err)
                                        return
                                    }
                                    const sql = "UPDATE cart SET total = total - ? WHERE id = ?"
                                    db.run(sql, [price,cart_id], function (err) {
                                        if(err){
                                            reject(err)
                                            return
                                        }
                                        resolve(true)
                                    })
                                
                                })
                            }
                        })
                    });

                })
            }catch(err){
                reject(err)
            }
            })
        }


        clearUserCart(user: User): Promise<Boolean>{
            return new Promise( (resolve,reject) => {
                try{
                    const verifyCartIsPresentAndNotEmpty = "SELECT c.id FROM cart c JOIN product_in_cart pic ON c.id=pic.cart_id WHERE c.username = ? AND c.paid='false'"
                    db.all(verifyCartIsPresentAndNotEmpty, [user.username], (err: Error | null, rows: any[]) => {
                        if(err){
                            reject(err)
                            return
                        }
                        if(!rows || rows.length==0){
                            reject(new CartNotFoundError())
                            return
                        }
                        const sqlDelete = "DELETE FROM product_in_cart WHERE cart_id = ?"
                        console.log("SQL DELETE called. Row id: " + rows[0].id)
                        db.run(sqlDelete, [rows[0].id], function(err)  {
                        if(err){
                            reject(err)
                            return
                        }
                        const updateTotal = "UPDATE cart SET total = 0 WHERE id = ?"
                        db.run(updateTotal, [rows[0].id], function(err)  {
                            if(err){
                                reject(err)
                                return
                            }
                            resolve(true)
                        })   
                    });
                })
                }catch(err){

                }
            })
        }

        deleteAllCarts(): Promise<Boolean> {
            return new Promise<Boolean> ((resolve,reject) => {
                try{
                    const sql = "DELETE FROM product_in_cart";
                    db.run(sql, [], function (err) {
                        if (err) {
                            reject(err);
                            return;
                        } 
                        const sql= "UPDATE SQLITE_SEQUENCE SET seq = 0 WHERE name = 'product_in_cart'"
                        db.run(sql, [], function (err) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            const sql= "DELETE FROM cart"
                            db.run(sql, [], function (err) {
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                const sql = "UPDATE SQLITE_SEQUENCE SET seq = 0 WHERE name = 'cart'";
                                db.run(sql, [], function (err) {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
                                    console.log("all carts deleted successfully!!")
                                    resolve(true)
            
                                    
                                });    
                                
                            });    
                            
                        });
                    })    
                }
                catch(err){
                    console.log(err)
                }  
            })
        }
}

export default CartDAO