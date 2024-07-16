import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals"

import CartController from "../../src/controllers/cartController"
import CartDAO from "../../src/dao/cartDAO"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import sqlite3 from 'sqlite3' //maybe to delete
import { Role, User } from "../../src/components/user"
import { Category, Product } from "../../src/components/product"
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../../src/errors/productError"
import { fail } from "assert"
import { CartNotFoundError, EmptyCart404Error, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError"
import { Cart, ProductInCart } from "../../src/components/cart"


const product1 = new Product('Iphone13', Category.SMARTPHONE,  5, 'no details available', 1000, '2024-06-30');
const product1InCart = new ProductInCart(product1.model, product1.quantity, product1.category, product1.sellingPrice)

const exampleUser = new User("customer", "John", "smith", Role.CUSTOMER, "Turin, Duca Abruzzi 24", "01-01-2001")

const productsForSelectCurrentCart = [{
  model : "iphone13", quantity: 10, category: "Smartphone", sellingPrice : 1200, total: 1000
},
{ 
  model : "headphones", quantity: 100, category: "Appliance", sellingPrice : 20, total: 1000
}
]

//product 2 has no qt available
const product2 = new Product('Headphones', Category.APPLIANCE, 0, 'no details available', 30, '2024-06-25' );
const product2InCart = new ProductInCart(product2.model, product2.quantity, product2.category,  product2.sellingPrice);


let cartDAO: CartDAO;

beforeEach(() => {
  cartDAO = new CartDAO();
});

afterEach(() => {
  jest.restoreAllMocks();
});




function mockRunOnce(accessoryData: string | null){
  return jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
    callback(null)
    return {} as Database
  });
}

function mockGetOnce(queryResult: any | null, accessoryData: string | null){
  return jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
    callback(accessoryData, queryResult)
    return {} as Database
  });
}

function mockAllOnce(queryResult: any[] | null, accessoryData: string | null){
  return jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
    callback(accessoryData, queryResult)
    return {} as Database
  });
}


describe("cartDAO.addProduct", () => {
  test("Product exists, cart exists, row exists", async () => {
    let cartDAO = new CartDAO();
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      if(sql == 'SELECT category, quantity, sellingPrice FROM product WHERE model = ?'){
        callback(null, product1)
      }
      else{
        callback(null, {"cartId": product1.model, "productCount" : 5})
      }
      return {} as Database
  });

  const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
    callback(null)
    return {} as Database
  });


  const result = await cartDAO.addProduct(new User("customer", "John", "smith", Role.CUSTOMER, "Turin, Duca Abruzzi 24", "01-01-2001"), "iPhone7")
  expect(result).toBe(true)
  });

  test("Product exists, cart exists, row doesn't exists", async () => {
    let cartDAO = new CartDAO();
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      if(sql == 'SELECT category, quantity, sellingPrice FROM product WHERE model = ?'){
        callback(null, product1)
      }
      else{
        callback(null, {"cartId": product1.model, "productCount" : 0})
      }
      return {} as Database
  });

  const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
    callback(null)
    return {} as Database
  });

  const result = await cartDAO.addProduct(new User("customer", "John", "smith", Role.CUSTOMER, "Turin, Duca Abruzzi 24", "01-01-2001"), "iPhone7")
  expect(result).toBe(true)
  })

  //unfortunately this doesn't work because of "this.lastId" => We need to understand how to mock!
  test("Product exists, cart does not exists", async () => {
    let cartDAO = new CartDAO();
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      if(sql == 'SELECT category, quantity, sellingPrice FROM product WHERE model = ?'){
        callback(null, product1)
      }
      else{
        callback(null, null)
      }
      return {} as Database
  });

  const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
    callback.call({lastID: 5}); //(null)
    return {} as Database
  });
  const mockDBRun2 = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
    callback.call(null); //(null)
    return {} as Database
  });



  const result = await cartDAO.addProduct(new User("customer", "John", "smith", Role.CUSTOMER, "Turin, Duca Abruzzi 24", "01-01-2001"), "iPhone7")
  expect(result).toBe(true)
  });


  test("Product doesn't exist: ProductNotFoundError!", async () => {
    let cartDAO = new CartDAO();
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null, null)
      return {} as Database
  });
  
  let result;
  try{
    result = await cartDAO.addProduct(new User("customer", "John", "smith", Role.CUSTOMER, "Turin, Duca Abruzzi 24", "01-01-2001"), "iPhone7")
    fail("An error have not been thrown")
  }
  catch(exception){
    //if here it comes, the test works
    if(!(exception instanceof ProductNotFoundError)){
      fail("A wrong error has been thrown")
    }
  }
  })

  test("Product is not available: EmptyProductStockError!", async () => {
    let cartDAO = new CartDAO();
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null, product2);
      return {} as Database
  });
  let result;
  try{
    result = await cartDAO.addProduct(new User("customer", "John", "smith", Role.CUSTOMER, "Turin, Duca Abruzzi 24", "01-01-2001"), "iPhone7")
    fail("An error have not been thrown")
  }
  catch(exception){
    //if here it comes, the test works
    if(!(exception instanceof EmptyProductStockError)){
      fail("A wrong error has been thrown")
    }
  }
  })

})

//getCurrentCart
describe("cartDAO.getCurrentCart", () => {
  test("rows empty", async () => {
    let cartDAO = new CartDAO();
    //case 1: null
    const mockDBAll = mockAllOnce([], null);
    const result = await cartDAO.getCurrentCart(new User("customer", "John", "smith", Role.CUSTOMER, "Turin, Duca Abruzzi 24", "01-01-2001"))
    expect(result.products.length).toBe(0)
    expect(result.total).toBe(0)
  });

  test("rows exists", async () => {
    let cartDAO = new CartDAO();
    //case 1: null
    const mockDBAll = mockAllOnce(productsForSelectCurrentCart, null);
    const result = await cartDAO.getCurrentCart(new User("customer", "John", "smith", Role.CUSTOMER, "Turin, Duca Abruzzi 24", "01-01-2001"))
    expect(result.products.length).toBe(2)
    expect(result.products[0].model).toBe(productsForSelectCurrentCart[0].model)
    expect(result.customer).toBe("customer")
    expect(result.total).toBe(1000)
  });
});

/**  
 * Tests to to:
 * 1. first select: CartNotFoundError
 * 2. second select: EmptyCartError
 * 3. second select: EmptyProductStockError
 * 4. second select: LowProductStockError
 * 5. update: product changed (return true)
*/
describe("cartDAO.checkoutCart", () => {

  test("first select: CartNotFoundError", async () => {
    const mockDBGet = mockGetOnce([], null);
    try {
      await cartDAO.checkoutCart(exampleUser);
      fail("it should break");
    } catch (error) {
      expect(error instanceof CartNotFoundError).toBe(true);
    }
  });

  test("second select: EmptyCartError", async () => {
    const mockDBGet = mockGetOnce({existing : true}, null);
    const mockDbAll = mockAllOnce([], null);
    try {
      await cartDAO.checkoutCart(exampleUser);
      fail("it should break");
    } catch (error) {
      expect(error instanceof EmptyCartError).toBe(true);
    }
  });

  test("second select: EmptyProductStockError", async () => {
    const mockDBGet = mockGetOnce({existing : true}, null);
    const mockDbAll = mockAllOnce([{stock: 0}], null);

    try {
      await cartDAO.checkoutCart(exampleUser);
      fail("it should break");
    } catch (error) {
      expect(error instanceof EmptyProductStockError).toBe(true);
    }
  });

  test("second select: LowProductStockError", async () => {
    const mockDBGet = mockGetOnce({existing : true}, null);
    const mockDbAll = mockAllOnce([{stock: 5, quantityInCart : 6}], null);
    try {
      await cartDAO.checkoutCart(exampleUser);
      fail("it should break");
    } catch (error) {
      expect(error instanceof LowProductStockError).toBe(true);
    }
  });

  test("update statement: return true", async () => {
    const mockDBGet = mockGetOnce({existing : true}, null);
    const mockDbAll = mockAllOnce([{stock: 5, quantityInCart : 3}], null);
    const mockDbUpdate = mockRunOnce(null);
    const mockDbDecreaseAfterPurchase = mockRunOnce(null);
    const result = cartDAO.checkoutCart(exampleUser);
    //just tests everything works fine!
    });
});


/**
 * getCustomerCart
 * Tests to do:
 * 1. rows empty
 * 2. currentCart has 2 elements -> get correct cart
 */
describe("cartDAO.getCustomerCart", () => {

  test("first case: rows empty", async () => {
    const mockDBGet = mockAllOnce([], null);
    let result = await cartDAO.getCustomerCart(exampleUser);
    expect(result.length).toBe(0)
  });

  test("second case: rows present", async () => {
    const selectResult = [
      {cart_id: 10, payment_date: '2024-01-01', model: 'iPhone7', quantity: 1, category: 'Smartphone', sellingPrice:  873},
      {cart_id: 10, payment_date: '2024-01-01', model: 'headphones', quantity: 2, category: 'Appliance', sellingPrice:  30},
      {cart_id: 11, payment_date: '2024-01-06', model: 'dell 24', quantity: 1, category: 'Laptop', sellingPrice:  1200}
    ];
    const mockDB = mockAllOnce(selectResult, null);
    const result = await cartDAO.getCustomerCart(exampleUser);
    expect(result[0].customer).toEqual(exampleUser.username)
    expect(result.length).toEqual(2)
    expect(result[0].products.length).toEqual(2)
    expect(result[1].products.length).toEqual(1)
  });
});

/**
 * getAllCarts
 * Tests to do:
 * 1. rows empty
 * 2. rows evaluated, tests passed
 */
describe("cartDAO.getAllCarts", () => {

  test("first case: first rows empty", async () => {
    const mockDB = mockAllOnce([], null);
    let result = await cartDAO.getAllCarts();
    expect(result.length).toBe(0)
  });

  test("second case: rows present", async () => {
    // const selectResult = [
    //   {cart_id: 10, username: "superJohn", payment_date: '2024-01-01', model: 'iPhone7', quantity: 1, category: 'Smartphone', sellingPrice:  873, total: 1003},
    //   {cart_id: 10, username: "superJohn", payment_date: '2024-01-01', model: 'headphones', quantity: 2, category: 'Appliance', sellingPrice:  30, total: 1003},
    //   {cart_id: 12, username: "mrMoustache", payment_date: '2024-01-06', model: 'dell 24', quantity: 1, category: 'Laptop', sellingPrice:  1200, total: 1200}
    // ];
    const selectResult1 = [
      {id: 10, username: "superJohn", payment_date: '2024-01-01', paid: "false", total: 1003},
      {id: 12, username: "mrMoustache", payment_date: '2024-01-06', paid: "false", total: 1200}
    ];
    const selectResult2 = [
      {cart_id: 10, model: 'iPhone7', quantity: 1, category: 'Smartphone', sellingPrice:  873},
      {cart_id: 10, model: 'headphones', quantity: 2, category: 'Appliance', sellingPrice:  30},
      {cart_id: 12, model: 'dell 24', quantity: 1, category: 'Laptop', sellingPrice:  1200}
    ];
    const mockDB1 = mockAllOnce(selectResult1, null);
    const mockDB2 = mockAllOnce(selectResult2, null);
    const result = await cartDAO.getAllCarts();
    expect(result[0].customer).toEqual("superJohn")
    expect(result.length).toEqual(2)
    expect(result[0].products.length).toEqual(2)
    expect(result[1].products.length).toEqual(1)
    expect(result[1].products.length).toEqual(1)
    expect(result[1].total).toBe(1200)
  });
});

/**removeProductFromCart
 * Tests:
 * 1. first select: ProductNotFoundError
 * 2. second select: CartNotFoundError
 * 3. second select: ProductNotInCartError
 * 4. qt> 1 -> update qt and total
 * 5. qt == 1 -> delete line from DB 
 */
describe("cartDAO.removeProductFromCart", () => {

  test("first select test: expect ProductNotFoundError", async () => {
    const mockDB = mockGetOnce([], null);
    try{
      let result = await cartDAO.removeProductFromCart(exampleUser, 'notExistingProduct');
      fail("it should breaks")
    }
    catch(error){
      expect(error instanceof ProductNotFoundError).toBe(true);
    }
  });

  test("second select test: expect CartNotFoundError, []", async () => {
    const mockDBGet = mockGetOnce([{category: "Smartphone", quantity: 5, sellingPrice: 50}], null);
    const mockDBAGet2 = mockGetOnce(null, null);
    try{
      let result = await cartDAO.removeProductFromCart(exampleUser, 'notExistingProduct');
      fail("it should breaks")
    }
    catch(error){
      expect(error instanceof CartNotFoundError).toBe(true);
    }
  });

  test("third select test: expect EmptyCart404Error, ", async () => {
    const mockDBGet = mockGetOnce([{category: "Smartphone", quantity: 5, sellingPrice: 50}], null);
    const mockDBAGet2 = mockGetOnce({id: 3}, null);
    const mockDBAll = mockAllOnce([], null);
    try{
      let result = await cartDAO.removeProductFromCart(exampleUser, 'notExistingProduct');
      fail("it should breaks")
    }
    catch(error){
      expect(error instanceof EmptyCart404Error).toBe(true);
    }
  });

  test("third select test: expect ProductNotInCartError, productsNumber==0", async () => {
    const mockDBGet = mockGetOnce([{category: "Smartphone", quantity: 5, sellingPrice: 50}], null);
    const mockDBAGet2 = mockGetOnce({id: 3}, null);
    const mockDBAll = mockAllOnce([{model: "productDifferentFromPassed", quantity: 2, sellingPrice: 30}, {model: "product2DifferentFromPassed", quantity: 3, sellingPrice: 50}], null);
    try{
      let result = await cartDAO.removeProductFromCart(exampleUser, 'notInCartProduct');
      fail("it should breaks");
    }
    catch(error){
      expect(error instanceof ProductNotInCartError).toBe(true);
    }
  });

  test("qt>1, update test", async () => {
    const mockDBGet = mockGetOnce([{category: "Smartphone", quantity: 5, sellingPrice: 50}], null);
    const mockDBAGet2 = mockGetOnce({id: 3}, null);
    const mockDBAll = mockAllOnce([
      {model: "productDifferentFromPassed", quantity: 2, sellingPrice: 25}, 
      {model: "productPassed", quantity: 2, sellingPrice: 28}], null);
    const mockDbRun1 = mockRunOnce(null);
    const mockDbRun2 = mockRunOnce(null);
    let result = await cartDAO.removeProductFromCart(exampleUser, 'productPassed');
    expect(result).toBe(true);
  });

  test("qt==1, delete test", async () => {
    const mockDBGet = mockGetOnce([{category: "Smartphone", quantity: 5, sellingPrice: 50}], null);
    const mockDBAGet2 = mockGetOnce({id: 3}, null);
    const mockDBAll = mockAllOnce([
      {model: "productDifferentFromPassed", quantity: 1, sellingPrice : 25}, 
      {model: "productPassed", quantity: 1, sellingPrice : 28}], null);
    const mockDbRun1 = mockRunOnce(null);
    const mockDbRun2 = mockRunOnce(null);
    let result = await cartDAO.removeProductFromCart(exampleUser, 'productPassed');
    expect(result).toBe(true);
  });
});

/**
 * clearUserCart.
 * Tests:
 * 1. first select: rows empty -> CartNotFoundError
 * 2. correct run: double delete -> resolve true
 */
describe("cartDAO.clearUserCart", () => {

  test("first select: rows empty -> CartNotFoundError", async () => {
    const mockDB = mockAllOnce([], null);
    try{
      let result = await cartDAO.clearUserCart(exampleUser);
      fail("it should breaks")
    }
    catch(error){
      expect(error instanceof CartNotFoundError).toBe(true);
    }
  });

  test("correct run: double delete -> resolve true", async () => {
    const mockDBGet = mockAllOnce([{id: 123}], null);
    const mockDbRun1 = mockRunOnce(null);
    const mockDbRun2 = mockRunOnce(null);
    let result = await cartDAO.clearUserCart(exampleUser);
    expect(result).toBe(true);
  });
});

/**
 * deleteAllCarts.
 */
describe("cartDAO.deleteAllCarts", () => {

  test("only one test: return true", async () => {
    const mockDBRun1 = mockRunOnce(null);
    const mockDBRun2 = mockRunOnce(null);
    const mockDBRun3 = mockRunOnce(null);
    const mockDBRun4 = mockRunOnce(null);
    let result = await cartDAO.deleteAllCarts();
    expect(result).toBe(true);
  });
});

