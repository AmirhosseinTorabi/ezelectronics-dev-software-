import { describe, test, expect, beforeAll, afterAll, afterEach, beforeEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import { fail } from "assert"



const routePath = "/ezelectronics" //Base route path for the API

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const customer2 = { username: "customer2", name: "customer2", surname: "customer2", password: "customer2", role: "Customer" }
const customer3 = { username: "customer3", name: "customer3", surname: "customer3", password: "customer3", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string;
let customer2Cookie: string;
let customer3Cookie: string;
let adminCookie: string;
let registeredProducts: any[];
let emptyProduct: any;

//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
    console.log("user inseritooo")

}


//Helper function that logs in a user and returns the cookie
//Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

//Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeEach(async () => {
    await cleanup()
    await postUser(admin)
    await postUser(customer)
    await postUser(customer2)
    await postUser(customer3)
    adminCookie = await login(admin)
    customerCookie = await login(customer)
    customer3Cookie = await login(customer3) //customer 3 has not cart at all
    customer2Cookie = await login(customer2)
    registeredProducts = await registerProducts();
    emptyProduct = await registerEmptyProduct();
    await addProductsToCart(); //add products only for customer 1! Customer2 has an empty cart!
})

async function forceCleanup() {
    await cleanup()
    await postUser(admin)
    await postUser(customer)
    await postUser(customer2)
    await postUser(customer3)
    adminCookie = await login(admin)
    customerCookie = await login(customer)
    customer2Cookie = await login(customer2)
    customer3Cookie = await login(customer3) //customer 3 has not cart at all
    registeredProducts = await registerProducts();
    emptyProduct = await registerEmptyProduct();
    await addProductsToCart(); //add products only for customer 1! Customer2 has an empty cart!
}

//After executing tests, we remove everything from our test database
afterEach(async () => {
    await cleanup()
})

const registerProducts = (async () => {
    await request(app).post(`${routePath}/products`)
        .set("Cookie", adminCookie)
        .send({ "model": "iPhone_13", "category": "Smartphone", "quantity": 3, "details": "", "sellingPrice": 200, "arrivalDate": "2024-01-01" }).expect(200);
    await request(app).post(`${routePath}/products`)
        .set("Cookie", adminCookie)
        .send({ "model": "Headphones", "category": "Appliance", "quantity": 5, "details": "", "sellingPrice": 30, "arrivalDate": "2024-01-01" }).expect(200);
    //get and save the products:
    const registeredProduct1 = await request(app).get(`${routePath}/products?grouping=model&model=iPhone_13&`)
        .set("Cookie", adminCookie).expect(200);
    const registeredProduct2 = await request(app).get(`${routePath}/products?grouping=model&model=Headphones&`)
        .set("Cookie", adminCookie).expect(200);
    return [registeredProduct1.body[0], registeredProduct2.body[0]];

});

const registerEmptyProduct = (async () => {
    await request(app).post(`${routePath}/products`)
        .set("Cookie", adminCookie)
        .send({ "model": "emptyItem", "category": "Smartphone", "quantity": 1, "details": "", "sellingPrice": 200, "arrivalDate": "2024-01-01" }).expect(200);
    await request(app).patch(`${routePath}/products/emptyItem/sell`)
        .set("Cookie", adminCookie)
        .send({ "sellingDate": "2024-01-02", "quantity": 1 }).expect(200);
    const result = await request(app).get(`${routePath}/products?grouping=model&model=emptyItem&`)
        .set("Cookie", adminCookie).expect(200);
    return result.body[0]
})

const addProductsToCart = (async () => {
    await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie)
        .send({ "model": "iPhone_13" }).expect(200);
    await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie)
        .send({ "model": "Headphones" }).expect(200);

    //customer2 has not a null cart, but a empty cart:
    await request(app).post(`${routePath}/carts`).set("Cookie", customer2Cookie)
    .send({ "model": "Headphones" }).expect(200);
    //customer2 has not a null cart, but a empty cart:
    await request(app).delete(`${routePath}/carts/products/Headphones`).set("Cookie", customer2Cookie).expect(200);
});



describe("Cart routes integration tests", () => {
    //unhautorized == 401
    /**
     * tests to do:
     * 1. No cart present -> cost==0, no products
     * 2. cart exists but is bought -> cost ==0,  no products
     * 3. Insert and get the product by model -> Verify it's ok
     */
    describe("GET ezelectronics/carts (getCurrentCart)", () => {

        test("Unhautorized == 401", async () => {
            await request(app).get(`${routePath}/carts`).set("Cookie", adminCookie).expect(401);
        });


        test("No cart present -> cost==0, no products", async () => {
            const currentCart = await request(app).get(`${routePath}/carts`).set("Cookie", customer2Cookie).expect(200);
            expect(currentCart.body.products.length).toBe(0);
            expect(currentCart.body.customer).toBe(customer2.username);
            expect(currentCart.body.paid).toBe(false);
            expect(currentCart.body.total).toBe(0);
        });


        test("It should get the product", async () => {
            //get the current cart as user:
            const currentCart = await request(app).get(`${routePath}/carts`).set("Cookie", customerCookie).expect(200);
            expect(currentCart.body.products.length).toBe(2);
            expect(currentCart.body.customer).toBe(customer.username);
            expect(currentCart.body.paid).toBe(false);
            expect(currentCart.body.products[0].model).toBe(registeredProducts[0].model);
            expect(currentCart.body.products[1].model).toBe(registeredProducts[1].model);
            expect(currentCart.body.total).toBe(parseFloat(registeredProducts[0].sellingPrice) + parseFloat(registeredProducts[1].sellingPrice));
        })

        test("Cart exists but is bought -> cost==0, no products", async () => {
            await request(app).patch(`${routePath}/carts`).set("Cookie", customerCookie).expect(200);
            const currentCart = await request(app).get(`${routePath}/carts`).set("Cookie", customerCookie).expect(200);
            expect(currentCart.body.products.length).toBe(0);
            expect(currentCart.body.customer).toBe(customer.username);
            expect(currentCart.body.paid).toBe(false);
            expect(currentCart.body.total).toBe(0);
        });
    })

    /**
     * addProduct tests:
     * 1. Login as admin -> 401 error
     * 2. model does not exists -> ProductNotFoundError [404]
     * 3. qt==0 -> EmptyProductStockError() [409]
     * 4. No unpaid cart present -> creates the cart and return it with 1 item
     * 5. Cart is present but the added product does not exists -> qt ==1
     * 6. Cart is present and the cart already exists (2nd test) => qt==2
     */
    describe("POST ezelectronics/carts (addProduct)", () => {

        test("Login as admin -> 401 error", async () => {
            await request(app).post(`${routePath}/carts`).set("Cookie", adminCookie)
                .send({ "model": "iPhone_13" }).expect(401);
        });

        test("model does not exists -> ProductNotFoundError [404]", async () => {
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie)
                .send({ "model": "notExisting" }).expect(404);
        });

        test("qt==0 -> EmptyProductStockError() [409]", async () => {
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie)
                .send({ "model": emptyProduct["model"] }).expect(409);
        });

        test("No unpaid cart present -> creates the cart and return it with 1 item", async () => {
            // add this product to a void cart (customer2)
            await request(app).post(`${routePath}/carts`).set("Cookie", customer2Cookie)
                .send({ "model": "iPhone_13" }).expect(200);
            // get the cart of customer2
            const currentCart = await request(app).get(`${routePath}/carts`).set("Cookie", customer2Cookie).expect(200);
            // verify the cart exists, has 1 product and its qtInTheCart==1
            expect(currentCart.body.products.length).toBe(1);
            expect(currentCart.body.customer).toBe(customer2.username);
            expect(currentCart.body.paid).toBe(false);
            expect(currentCart.body.total).toBe(parseFloat(registeredProducts[0].sellingPrice));
            expect(currentCart.body.products[0].quantity).toBe(1);
            expect(currentCart.body.products[0].price).toBe(parseFloat(registeredProducts[0].sellingPrice));
        });

        test("Cart is present but the added product does not exists -> qt ==1", async () => {

            // add "new" products to the previous cart (customer2)
            await request(app).post(`${routePath}/carts`).set("Cookie", customer2Cookie)
                .send({ "model": "iPhone_13" }).expect(200);
            await request(app).post(`${routePath}/carts`).set("Cookie", customer2Cookie)
                .send({ "model": "Headphones" }).expect(200);
            // get the cart of customer2
            const currentCart = await request(app).get(`${routePath}/carts`).set("Cookie", customer2Cookie).expect(200);
            // verify the cart exists, has 2 product and qtInTheCart==1 for both
            expect(currentCart.body.products.length).toBe(2);
            expect(currentCart.body.customer).toBe(customer2.username);
            expect(currentCart.body.paid).toBe(false);
            expect(currentCart.body.total).toBe(parseFloat(registeredProducts[0].sellingPrice) + parseFloat(registeredProducts[1].sellingPrice));
            expect(currentCart.body.products[0].quantity).toBe(1);
            expect(currentCart.body.products[1].quantity).toBe(1);
            expect(currentCart.body.products[0].price).toBe(parseFloat(registeredProducts[0].sellingPrice));
            expect(currentCart.body.products[1].price).toBe(parseFloat(registeredProducts[1].sellingPrice));
        });

        test("Cart is present and the product already exists (2nd test) => qt==2", async () => {
            await request(app).post(`${routePath}/carts`).set("Cookie", customer2Cookie)
                .send({ "model": "iPhone_13" }).expect(200);
            //add 2 times headphones to the cart:
            for (let i = 0; i < 2; i++) {
                await request(app).post(`${routePath}/carts`).set("Cookie", customer2Cookie)
                    .send({ "model": "Headphones" }).expect(200);
            }
            // get the cart of customer2
            const currentCart = await request(app).get(`${routePath}/carts`).set("Cookie", customer2Cookie).expect(200);
            // verify the cart exists, has 2 product and qtInTheCart==1 for both
            expect(currentCart.body.products.length).toBe(2);
            expect(currentCart.body.customer).toBe(customer2.username);
            expect(currentCart.body.paid).toBe(false);
            expect(currentCart.body.total).toBe(parseFloat(registeredProducts[0].sellingPrice) + parseFloat(registeredProducts[1].sellingPrice) * 2);
            expect(currentCart.body.products[0].quantity).toBe(1);
            expect(currentCart.body.products[1].quantity).toBe(2);
            expect(currentCart.body.products[0].price).toBe(parseFloat(registeredProducts[0].sellingPrice));
            expect(currentCart.body.products[1].price).toBe(parseFloat(registeredProducts[1].sellingPrice));
        });


    })

    /**Tests: (by code, then by API.md)
     * - access as admin -> 404
     * - not existing cart: CartNotFoundError (customer2) [404]
     * - existing cart but empty: EmptyCartError (customer2, add and remove) [400] 
     * - product with qt==0: EmptyProductStockError [409]
     * - product with qtReq<qtAvail in cart: LowProductStockError [409]
     * - checkout gone as customer -> getAllCarts as admin and see if cart is bought and products are decreased
     */
    describe("PATCH ezelectronics/carts (checkoutCart)", () => {

        test("Login as admin -> 401 error", async () => {
            await request(app).patch(`${routePath}/carts`).set("Cookie", adminCookie).expect(401);
        });

        test("not existing cart: CartNotFoundError (customer3) [404]", async () => {
            await request(app).patch(`${routePath}/carts`).set("Cookie", customer3Cookie).expect(404);
        });

        test("existing cart but empty: EmptyCartError (customer2, add and remove)  [400]", async () => {
            await request(app).patch(`${routePath}/carts`).set("Cookie", customer2Cookie).expect(400);
        }, 600000);

        test("product with qt==0: EmptyProductStockError [409]", async () => {
            //customer3 + void product
            //insert a product with qt==0 to the cart of the customer1 -> add to cart and then reduce qt to 0:
            await request(app).post(`${routePath}/carts`).set("Cookie", customer3Cookie)
            .send({ "model": "iPhone_13"}).expect(200);  
            await request(app).patch(`${routePath}/products/iPhone_13/sell`)
            .set("Cookie", adminCookie)
            .send({"sellingDate": "2024-01-02", "quantity": 3}).expect(200); 
            //make a test
            await request(app).patch(`${routePath}/carts`).set("Cookie", customer3Cookie).expect(409);    
        }, 600000);


        test("product with qtReq<qtAvail in cart: LowProductStockError [409]]", async () => {
            //use of customer1
            //add 3 i_phone13 to the cart - 1 is present, they will be 4 vs av. qt of 3 (av. qt is 3!)
            for (let i = 0; i < 3; i++) {
                await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie)
                    .send({ "model": registeredProducts[0].model }).expect(200);
            }
            //make the test
            await request(app).patch(`${routePath}/carts`).set("Cookie", customerCookie).expect(409);
        });

        test("checkout gone as customer -> getAllCarts as admin and see if cart is bought and products are decreased", async () => {
            //buy in the cart:
            await request(app).patch(`${routePath}/carts`).set("Cookie", customerCookie).expect(200);
            //get the old cart and see if it results sold and have the products 1 and 2
            const arrayOfHistoricalCarts = await request(app).get(`${routePath}/carts/history`).set("Cookie", customerCookie).expect(200);
            //get the products
            const products1AfterSale = await request(app).get(`${routePath}/products?grouping=model&model=${registeredProducts[0].model}`).set("Cookie", adminCookie).expect(200);
            const products2AfterSale = await request(app).get(`${routePath}/products?grouping=model&model=${registeredProducts[1].model}`).set("Cookie", adminCookie).expect(200);
            //see if last array is paid and total is fine:
            expect(arrayOfHistoricalCarts.body[0].paid).toBe(true)
            expect(arrayOfHistoricalCarts.body.length).toBe(1)
            expect(arrayOfHistoricalCarts.body[0].total).toBe(parseFloat(registeredProducts[0].sellingPrice) + parseFloat(registeredProducts[1].sellingPrice))
            expect(arrayOfHistoricalCarts.body[0].products.length).toBe(2)
            expect(arrayOfHistoricalCarts.body[0].products[0].quantity).toBe(1)
            expect(arrayOfHistoricalCarts.body[0].products[1].quantity).toBe(1)
            //See if qt is decreased
            expect(products1AfterSale.body[0].quantity).toBe(registeredProducts[0].quantity - 1)
            expect(products2AfterSale.body[0].quantity).toBe(registeredProducts[1].quantity - 1)
        });
    })

    /** getCustomerCart, tests to do:
     * 1. Login as admin -> 401 error 
     * 2. Not existing paid cart -> return []
     * 3. Carts exist -> return Cart with products_in_cart
     */
    describe("GET ezelectronics/carts/history (getCustomerCart)", () => {

        test("Login as admin -> 401 error", async () => {
            await request(app).get(`${routePath}/carts/history`).set("Cookie", adminCookie).expect(401);
        });

        test("Not existing paid cart -> return []", async () => {
            //for customer1 there is not paid cart until we checkout! 
            const result = await request(app).get(`${routePath}/carts/history`).set("Cookie", customerCookie).expect(200);
            expect(result.body.length).toBe(0);
        });

        test("Carts exist -> return Cart with products_in_cart", async () => {
            //checkout the unpaid cart for customer1
            await request(app).patch(`${routePath}/carts`).set("Cookie", customerCookie).expect(200);
            //add a product to a new unpaid cart
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie)
                .send({ "model": registeredProducts[0].model }).expect(200);
            //checkout the second cart for customer1
            await request(app).patch(`${routePath}/carts`).set("Cookie", customerCookie).expect(200);
            //get both paid carts
            const result = await request(app).get(`${routePath}/carts/history`).set("Cookie", customerCookie).expect(200);
            //check: paid_carts=2, products=2 for first, 1 for second, model for second, model for first
            expect(result.body.length).toBe(2);
            expect(result.body[0].products.length).toBe(2);
            expect(result.body[1].products.length).toBe(1);
            expect(result.body[0].products[0].model).toBe(registeredProducts[0].model);
            expect(result.body[0].products[1].model).toBe(registeredProducts[1].model);
            expect(result.body[1].products[0].model).toBe(registeredProducts[0].model);
            expect(result.body[0].total).toBe(parseFloat(registeredProducts[0].sellingPrice) + parseFloat(registeredProducts[1].sellingPrice));
            expect(result.body[1].total).toBe(parseFloat(registeredProducts[0].sellingPrice));
            expect(result.body[0].customer).toBe(customer.username);
            expect(result.body[1].customer).toBe(customer.username);
        });
    });

    /** removeProductFromCart, tests to do:
 * 1. Login as admin -> 401 error
 * 2. Model does not exists -> ProductNotFoundError [404]
 * 3. There is no unpaid_cart (customer3) -> CartNotFoundError [404]
 * 4. There is an unpaid_cart but it is empty (customer2) -> CartNotFoundError [404]
 * 5. Model is not in cart -> ProductNotInCartError [404] 
 * 6. 2 carts items, one is deleted successfully
 * 7. 1 cart item with qt==2, one is deleted successfully 
 */
    describe("DELETE ezelectronics/carts/products/:model (removeProductFromCart)", () => {

        test("Login as admin -> 401 error", async () => {
            await request(app).delete(`${routePath}/carts/products/shouldFail`).set("Cookie", adminCookie).expect(401);
        });

        test("Model does not exists -> ProductNotFoundError [404]", async () => {
            //cart do exists -> customerCookie has a cart
            await request(app).delete(`${routePath}/carts/products/notExistingProduct`).set("Cookie", customerCookie).expect(404);
        });

        test("There is no unpaid_cart (customer3) -> CartNotFoundError [404]", async () => {
            //use of customer3 and an existing product
            await request(app).delete(`${routePath}/carts/products/${registeredProducts[0].model}`).set("Cookie", customer3Cookie).expect(404);
        });

        test("There is an unpaid_cart but is empty (customer2) -> CartNotFoundError [404]", async () => {
            //use of customer2 (empty but existing cart) and an existing product
            await request(app).delete(`${routePath}/carts/products/${registeredProducts[0].model}`).set("Cookie", customer2Cookie).expect(404);
        });

        test("Model is not in cart -> ProductNotInCartError [404]", async () => {
            //use of customer (existing cart) and an existing product, but not in cart
            await request(app).delete(`${routePath}/carts/products/${emptyProduct.model}`).set("Cookie", customerCookie).expect(404);
        });

        test("2 items in cart, one is deleted successfully", async () => {
            //use of customer1: 2 items in cart
            //delete the item1 from the cart
            await request(app).delete(`${routePath}/carts/products/${registeredProducts[0].model}`).set("Cookie", customerCookie).expect(200);
            //get the cart
            const currentCart = await request(app).get(`${routePath}/carts/`).set("Cookie", customerCookie).expect(200);
            //verify only 1 product present and of the right type
            expect(currentCart.body.products.length).toBe(1);
            expect(currentCart.body.customer).toBe(customer.username);
            expect(currentCart.body.products[0].model).toBe(registeredProducts[1].model);
            expect(currentCart.body.total).toBe(parseFloat(registeredProducts[1].sellingPrice));
            expect(currentCart.body.paid).toBe(false);
        });

        test("2 carts items (1 with qt>1) -> qt reduced successfully", async () => {
            //use of customer1: 2 items in cart
            //add 1 more of the item1 from the cart
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie)
                .send({ "model": registeredProducts[0].model }).expect(200);
            //remove item 1 from the cart
            await request(app).delete(`${routePath}/carts/products/${registeredProducts[0].model}`).set("Cookie", customerCookie).expect(200);
            //get the current cart
            const currentCart = await request(app).get(`${routePath}/carts/`).set("Cookie", customerCookie).expect(200);
            //verify that qt of item1 == 1
            expect(currentCart.body.products.length).toBe(2);
            expect(currentCart.body.customer).toBe(customer.username);
            expect(currentCart.body.products[0].model).toBe(registeredProducts[0].model);
            expect(currentCart.body.products[1].model).toBe(registeredProducts[1].model);
            expect(currentCart.body.products[0].quantity).toBe(1);
            expect(currentCart.body.products[1].quantity).toBe(1);
            expect(currentCart.body.total).toBe(parseFloat(registeredProducts[0].sellingPrice) + parseFloat(registeredProducts[1].sellingPrice));
            expect(currentCart.body.paid).toBe(false);
        });

    });


    /** clear the cart, tests to do:
    * 1. Login as admin -> 401 error
    * 2. No unpaid cart present for the customer -> CartNotFoundError [404]
    * 3. Cart cleared -> Verify it's clear and total
    */
    describe("DELETE ezelectronics/carts/current (clearUserCart)", () => {

        test("Login as admin -> 401 error", async () => {
            await request(app).delete(`${routePath}/carts/current`).set("Cookie", adminCookie).expect(401);
        });

        test("No unpaid cart present for the customer -> CartNotFoundError [404]", async () => {
            //use of customer3 without cart
            await request(app).delete(`${routePath}/carts/current`).set("Cookie", customer3Cookie).expect(404);
        });

        
        test("Cart cleared -> Verify it si empty and total==0", async () => {
            //use of customer1 that have a cart
            await request(app).delete(`${routePath}/carts/current`).set("Cookie", customerCookie).expect(200);
            //get the current cart: expected cart with products empty:
            const currentCart = await request(app).get(`${routePath}/carts/`).set("Cookie", customerCookie).expect(200);
            expect(currentCart.body.products.length).toBe(0);
            expect(currentCart.body.total).toBe(0);
            expect(currentCart.body.paid).toBe(false);
            expect(currentCart.body.customer).toBe(customer.username);
        });
    });

        /** delete all the carts. Tests to do:
         * 1. User is customer -> 401 error
         * 2. Carts are deleted successfully
        */
        describe("DELETE ezelectronics/carts (deleteAllCarts)", () => {

            test("Login as a customer -> 401 error", async () => {
                await request(app).delete(`${routePath}/carts`).set("Cookie", customerCookie).expect(401);
            });
        
            
            test("Carts are deleted successfully", async () => {
                //use of all pre-initialized data + create & buy a cart
                await request(app).post(`${routePath}/carts`).set("Cookie", customer3Cookie)
                .send({ "model": registeredProducts[0].model }).expect(200);
                await request(app).patch(`${routePath}/carts`).set("Cookie", customer3Cookie).expect(200);
                //clear carts
                await request(app).delete(`${routePath}/carts`).set("Cookie", adminCookie).expect(200);
                //verify you get a cart with no products for each customer 
                const cart1 = await request(app).get(`${routePath}/carts/`).set("Cookie", customerCookie).expect(200);
                const cart2 = await request(app).get(`${routePath}/carts/`).set("Cookie", customer2Cookie).expect(200);
                const cartsHistory3 = await request(app).get(`${routePath}/carts/history`).set("Cookie", customer3Cookie).expect(200);
                const allCarts = await request(app).get(`${routePath}/carts/all`).set("Cookie", adminCookie).expect(200);
                expect(cart1.body.products.length).toBe(0);
                expect(cart1.body.customer).toEqual(customer.username);
                expect(cart2.body.products.length).toBe(0);
                expect(cart2.body.customer).toEqual(customer2.username);
                expect(cartsHistory3.body.length).toBe(0);
                expect(allCarts.body.length).toBe(0)
            });
        });

    /** get all the carts. Tests to do:
     * 1. User is customer -> 401 error
     * 2. All carts are returned
    */
    describe("GET ezelectronics/carts/all (getAllCarts)", () => {

        test("Login as a customer -> 401 error", async () => {
            await request(app).get(`${routePath}/carts/all`).set("Cookie", customerCookie).expect(401);
        });

        test("Get all carts", async () => {
            //add a paid cart for customer3
            await request(app).post(`${routePath}/carts`).set("Cookie", customer3Cookie)
            .send({ "model": registeredProducts[0].model }).expect(200);
            await request(app).patch(`${routePath}/carts`).set("Cookie", customer3Cookie).expect(200);
            //get all carts
            const allCarts = await request(app).get(`${routePath}/carts/all`).set("Cookie", adminCookie).expect(200);
            //tests
            expect(allCarts.body.length).toBe(3);
            expect(allCarts.body[0].paid).toBe(false);
            expect(allCarts.body[1].paid).toBe(false);
            expect(allCarts.body[2].paid).toBe(true);
            expect(allCarts.body[0].products.length).toBe(2); //4 but expected 2!
            expect(allCarts.body[1].products.length).toBe(0);
            expect(allCarts.body[2].products.length).toBe(1);
            expect(allCarts.body[0].customer).toEqual(customer.username);
            expect(allCarts.body[1].customer).toEqual(customer2.username);
            expect(allCarts.body[2].customer).toEqual(customer3.username);
        }, 600000);
    });
    

});

