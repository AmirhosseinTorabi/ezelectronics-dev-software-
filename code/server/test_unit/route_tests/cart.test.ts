import { test, expect, jest, describe, beforeEach} from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { User, Role } from "../../src/components/user"
import { ProductNotFoundError, EmptyProductStockError, LowProductStockError } from "../../src/errors/productError"
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError"
import CartController from "../../src/controllers/cartController"
import { Cart,ProductInCart } from "../../src/components/cart";
import {Category} from "../../src/components/product"
import Authenticator from "../../src/routers/auth"
const baseURL = "/ezelectronics"

let admin1 = new User("admin1","admin","admin",Role.ADMIN,"","")
let customer1 = new User("customer1","customer","customer",Role.CUSTOMER,"","")
let customer2 = new User("customer1","customer","customer",Role.CUSTOMER,"","")
let manager1 = new User("manager1","manager","manager",Role.MANAGER,"","")
let mockedPruductInCart = [new ProductInCart("Iphone13",1,Category.SMARTPHONE,100),new ProductInCart("Iphone10",1,Category.SMARTPHONE,100)]

// @ts-ignore 
let mockedCart = new Cart(customer1.username,false,null,200,mockedPruductInCart)
// @ts-ignore
let mockedCart1 = new Cart(customer1.username,false,null,200,mockedPruductInCart)

beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks()
    //additional `mockClear()` must be placed here
});

describe("GET ezelectronics/carts", () => {
    test("code 200, current cart returned", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(mockedCart) //Mock the createUser method of the controller
        const response = await request(app).get(baseURL + "/carts").send() //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(response.body).toEqual(mockedCart)
        expect(CartController.prototype.getCart).toHaveBeenCalledTimes(1) 
        expect(CartController.prototype.getCart).toHaveBeenCalledWith(customer1)  
    })
    test("code 401, not customer", async () => {
        jest.spyOn(CartController.prototype, "getCart") //Mock the createUser method of the controller
        const response = await request(app).get(baseURL + "/carts").send() //Send a POST request to the route
        expect(response.status).toBe(401) //Check if the response status is 200
        expect(CartController.prototype.getCart).toHaveBeenCalledTimes(0)  
    })
})

describe("POST ezelectronics/carts", () => {
    test("success 200", async () => {
        const mockedBody = {
            model: "Iphone13"
        }
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await request(app).post(baseURL + "/carts").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(1) 
        expect(CartController.prototype.addToCart).toHaveBeenCalledWith(customer1,mockedBody.model) 
    })
    test("error 422, wrong body content", async () => {
        const mockedModel = ""
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(CartController.prototype, "addToCart")
        const response = await request(app).post(baseURL + "/carts").send(mockedModel) //Send a POST request to the route
        expect(response.status).toBe(422) //Check if the response status is 200
        expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(0) 
    })
    test("error 401, no logged", async () => {
        const mockedBody = {
            model: "Iphone13"
        }
        jest.spyOn(CartController.prototype, "addToCart")
        const response = await request(app).post(baseURL + "/carts").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(401) //Check if the response status is 200
        expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(0) 
    })
    test("error 404, model not found", async () => {
        const mockedBody = {
            model: "Iphone13"
        }
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new ProductNotFoundError()) //Mock the createUser method of the controller
        const response = await request(app).post(baseURL + "/carts").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(404) //Check if the response status is 200
        expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(1) 
        expect(CartController.prototype.addToCart).toHaveBeenCalledWith(customer1,mockedBody.model) 
    })
    test("error 409, model not available", async () => {
        const mockedBody = {
            model: "Iphone13"
        }
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new EmptyProductStockError()) //Mock the createUser method of the controller
        const response = await request(app).post(baseURL + "/carts").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(409) //Check if the response status is 200
        expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(1) 
        expect(CartController.prototype.addToCart).toHaveBeenCalledWith(customer1,mockedBody.model) 
    })
})

describe("PATCH ezelectronics/carts", () => {
    test("success 200", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await request(app).patch(baseURL + "/carts").send() //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1) 
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledWith(customer1) 
    })
    test("error 404, no unpaid cart", async () => {
        
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new CartNotFoundError())
        const response = await request(app).patch(baseURL + "/carts").send() //Send a POST request to the route
        expect(response.status).toBe(404) //Check if the response status is 200
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1) 
    })
    test("error 400, empty cart", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new EmptyCartError())
        const response = await request(app).patch(baseURL + "/carts").send() //Send a POST request to the route
        expect(response.status).toBe(400) //Check if the response status is 200
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1) 
    })
    test("error 409, quantity model 0", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new EmptyProductStockError()) //Mock the createUser method of the controller
        const response = await request(app).patch(baseURL + "/carts").send() //Send a POST request to the route
        expect(response.status).toBe(409) //Check if the response status is 200
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1) 
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledWith(customer1) 
    })
    test("error 409, available quantity below", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new LowProductStockError()) //Mock the createUser method of the controller
        const response = await request(app).patch(baseURL + "/carts").send() //Send a POST request to the route
        expect(response.status).toBe(409) //Check if the response status is 200
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1) 
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledWith(customer1) 
    })
    test("error 401, no logged in", async () => {
        jest.spyOn(CartController.prototype, "checkoutCart")
        const response = await request(app).patch(baseURL + "/carts").send() //Send a POST request to the route
        expect(response.status).toBe(401) //Check if the response status is 200
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(0) 
    })
})

describe("GET ezelectronics/carts/history", () => {
    test("200 success code", async () =>{
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce([mockedCart,mockedCart1]) //Mock the createUser method of the controller
        const response = await request(app).get(baseURL + "/carts/history").send() //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledTimes(1) 
        expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledWith(customer1)
    })
    test("error 401, no logged in", async () => {
        jest.spyOn(CartController.prototype, "getCustomerCarts")
        const response = await request(app).get(baseURL + "/carts/history").send() //Send a POST request to the route
        expect(response.status).toBe(401) //Check if the response status is 200
        expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledTimes(0) 
    })
})

describe("DELETE ezelectronics/carts/products/:model", () => {
    test("sucess 200", async ()=>{
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await request(app).delete(baseURL + "/carts/products/iphone13").send() //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledTimes(1) 
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(customer1,"iphone13")
    })
    test("error 404, product not found", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotFoundError())
        const response = await request(app).delete(baseURL + "/carts/products/iphone13").send() //Send a POST request to the route
        expect(response.status).toBe(404) //Check if the response status is 200
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledTimes(1) 
    })
    test("error 404, no cart or product its not in the cart", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new CartNotFoundError()) //Mock the createUser method of the controller
        const response = await request(app).delete(baseURL + "/carts/products/iphone13").send() //Send a POST request to the route
        expect(response.status).toBe(404) //Check if the response status is 200
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledTimes(1) 
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(customer1,"iphone13") 
    })
    test("error 404, product not in cart", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotInCartError()) //Mock the createUser method of the controller
        const response = await request(app).delete(baseURL + "/carts/products/iphone13").send() //Send a POST request to the route
        expect(response.status).toBe(404) //Check if the response status is 200
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledTimes(1) 
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(customer1,"iphone13") 
    })
    test("error 401, no logged in", async () => {
        jest.spyOn(CartController.prototype, "removeProductFromCart")
        const response = await request(app).delete(baseURL + "/carts/products/iphone13").send() //Send a POST request to the route
        expect(response.status).toBe(401) //Check if the response status is 200
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledTimes(0) 
    })
})

describe("DELETE ezelectronics/carts/current", () => {
    test("success 200 ", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await request(app).delete(baseURL + "/carts/current").send() //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(CartController.prototype.clearCart).toHaveBeenCalledTimes(1) 
        expect(CartController.prototype.clearCart).toHaveBeenCalledWith(customer1)
    })
    test("error 404, no cart or product its not in the cart", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(CartController.prototype, "clearCart").mockRejectedValueOnce(new CartNotFoundError()) //Mock the createUser method of the controller
        const response = await request(app).delete(baseURL + "/carts/current").send() //Send a POST request to the route
        expect(response.status).toBe(404) //Check if the response status is 200
        expect(CartController.prototype.clearCart).toHaveBeenCalledTimes(1) 
        expect(CartController.prototype.clearCart).toHaveBeenCalledWith(customer1) 
    })
    test("error 401, no logged in", async () => {
        jest.spyOn(CartController.prototype, "clearCart")
        const response = await request(app).delete(baseURL + "/carts/current").send() //Send a POST request to the route
        expect(response.status).toBe(401) //Check if the response status is 200
        expect(CartController.prototype.clearCart).toHaveBeenCalledTimes(0) 
    })
})

describe("DELETE ezelectronics/carts", () => {
    test("sucess 200", async ()=>{
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = manager1;
            return next()})
        jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await request(app).delete(baseURL + "/carts").send() //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(CartController.prototype.deleteAllCarts).toHaveBeenCalledTimes(1) 
    })
    test("error 401, no logged in", async () => {
        jest.spyOn(CartController.prototype, "deleteAllCarts")
        const response = await request(app).delete(baseURL + "/carts").send() //Send a POST request to the route
        expect(response.status).toBe(401) //Check if the response status is 200
        expect(CartController.prototype.deleteAllCarts).toHaveBeenCalledTimes(0) 
    })
})

describe("GET ezelectronics/carts/all", () => {
    test("sucess 200", async ()=>{
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = manager1;
            return next()})
        jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce([mockedCart,mockedCart1]) //Mock the createUser method of the controller
        const response = await request(app).get(baseURL + "/carts/all").send() //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(CartController.prototype.getAllCarts).toHaveBeenCalledTimes(1) 
    })
    test("error 401, no logged in", async () => {
        jest.spyOn(CartController.prototype, "getAllCarts")
        const response = await request(app).get(baseURL + "/carts/all").send() //Send a POST request to the route
        expect(response.status).toBe(401) //Check if the response status is 200
        expect(CartController.prototype.getAllCarts).toHaveBeenCalledTimes(0) 
    })
})