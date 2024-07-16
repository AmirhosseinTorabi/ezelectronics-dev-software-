import { test, expect, jest, describe, beforeEach} from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { User, Role } from "../../src/components/user"
import { ProductNotFoundError, EmptyProductStockError, LowProductStockError, ProductAlreadyExistsError, SellingDateError, WrongParameterError } from "../../src/errors/productError"
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError"
import ProductController from "../../src/controllers/productController"
import { Product, Category } from "../../src/components/product";
import Authenticator from "../../src/routers/auth"
import ProductDao from "../../src/dao/productDAO"

let admin1 = new User("admin1","admin","admin",Role.ADMIN,"","")
let customer1 = new User("customer1","customer","customer",Role.CUSTOMER,"","")
let customer2 = new User("customer1","customer","customer",Role.CUSTOMER,"","")
let manager1 = new User("manager1","manager","manager",Role.MANAGER,"","")

let product1 = new Product("Iphone13",Category.SMARTPHONE,10,null,950,null)
let product2 = new Product("Iphone10",Category.SMARTPHONE,10,null,500,null)
beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks()
    //additional `mockClear()` must be placed here
});

describe("productController.registerProducts", () => {
    test("code 200 success", async () => {
        const model = "Iphone13"
        const category = Category.SMARTPHONE
        const quantity = 10
        const details = ""
        const sellingPrice = 200.50
        const mockedDate = "2024-06-08"
        const controller = new ProductController(); 
        jest.spyOn(ProductDao.prototype, "registerProducts").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await controller.registerProducts(model,category,quantity,details,sellingPrice,mockedDate) //Send a POST request to the route
        expect(response).toBe(true) //Check if the response status is 200
        expect(ProductDao.prototype.registerProducts).toHaveBeenCalledTimes(1) 
        expect(ProductDao.prototype.registerProducts).toHaveBeenCalledWith(model,category,quantity,details,sellingPrice,mockedDate)  
    })
    test("code 200 success, without passing arrivalDate", async () => {
        const model = "Iphone13"
        const category = Category.SMARTPHONE
        const quantity = 10
        const details = ""
        const sellingPrice = 200.50
        const controller = new ProductController();
        jest.spyOn(ProductDao.prototype, "registerProducts").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await controller.registerProducts(model,category,quantity,details,sellingPrice,null) //Send a POST request to the route
        expect(response).toBe(true) //Check if the response status is 200
        expect(ProductDao.prototype.registerProducts).toHaveBeenCalledTimes(1) 
        expect(ProductDao.prototype.registerProducts).toHaveBeenCalledWith(model,category,quantity,details,sellingPrice,new Date().toISOString().split('T')[0])  
    })
})

describe("productController.changeProductQuantity", () => {
    test("code 200 success", async () => {
        const model = "Iphone13"
        const quantity = 10
        const mockedDate = "2024-06-08"
        const controller = new ProductController(); 
        jest.spyOn(ProductDao.prototype, "changeProductQuantity").mockResolvedValueOnce(12) //Mock the createUser method of the controller
        const response = await controller.changeProductQuantity(model,quantity,mockedDate) //Send a POST request to the route
        expect(response).toBe(12) //Check if the response status is 200
        expect(ProductDao.prototype.changeProductQuantity).toHaveBeenCalledTimes(1) 
        expect(ProductDao.prototype.changeProductQuantity).toHaveBeenCalledWith(model,quantity,mockedDate)  
    })
    test("code 200 success, without passing arrivalDate", async () => {
        const model = "Iphone13"
        const mockedDate = "2024-06-08"
        const quantity = 10
        const controller = new ProductController();
        jest.spyOn(ProductDao.prototype, "changeProductQuantity").mockResolvedValueOnce(12) //Mock the createUser method of the controller
        const response = await controller.changeProductQuantity(model,quantity,null) //Send a POST request to the route
        expect(response).toBe(12) //Check if the response status is 200
        expect(ProductDao.prototype.changeProductQuantity).toHaveBeenCalledTimes(1) 
        expect(ProductDao.prototype.changeProductQuantity).toHaveBeenCalledWith(model,quantity,new Date().toISOString().split('T')[0])  
    })
})

describe("productController.sellProduct", () => {
    test("code 200 success", async () => {
        const model = "Iphone13"
        const quantity = 10
        const sellingDate = "2024-06-08"
        const controller = new ProductController(); 
        jest.spyOn(ProductDao.prototype, "sellProduct").mockResolvedValueOnce() //Mock the createUser method of the controller
        const response = await controller.sellProduct(model,quantity,sellingDate) //Send a POST request to the route
        expect(response).toBeUndefined() //Check if the response status is 200
        expect(ProductDao.prototype.sellProduct).toHaveBeenCalledTimes(1) 
        expect(ProductDao.prototype.sellProduct).toHaveBeenCalledWith(model,quantity,sellingDate)  
    })
    test("code 200 success, without passing arrivalDate", async () => {
        const model = "Iphone13"
        const quantity = 10
        const controller = new ProductController();
        jest.spyOn(ProductDao.prototype, "sellProduct").mockResolvedValueOnce() //Mock the createUser method of the controller
        const response = await controller.sellProduct(model,quantity,null) //Send a POST request to the route
        expect(response).toBeUndefined() //Check if the response status is 200
        expect(ProductDao.prototype.sellProduct).toHaveBeenCalledTimes(1) 
        expect(ProductDao.prototype.sellProduct).toHaveBeenCalledWith(model,quantity,new Date().toISOString().split('T')[0])  
    })
})

describe("productController.getProducts", () => {
    test("code 200 success", async () => {
        const grouping = "category"
        const category = "Smartphone"
        const controller = new ProductController(); 
        jest.spyOn(ProductDao.prototype, "getProducts").mockResolvedValueOnce([]) //Mock the createUser method of the controller
        const response = await controller.getProducts(grouping,category,null) //Send a POST request to the route
        expect(response).toEqual([]) //Check if the response status is 200
        expect(ProductDao.prototype.getProducts).toHaveBeenCalledTimes(1) 
        expect(ProductDao.prototype.getProducts).toHaveBeenCalledWith(grouping,category,null)  
    })
})
describe("productController.getAvailableProducts", () => {
    test("code 200 success", async () => {
        const grouping = "category"
        const category = "Smartphone"
        const controller = new ProductController(); 
        jest.spyOn(ProductDao.prototype, "getAvailableProducts").mockResolvedValueOnce([]) //Mock the createUser method of the controller
        const response = await controller.getAvailableProducts(grouping,category,null) //Send a POST request to the route
        expect(response).toEqual([]) //Check if the response status is 200
        expect(ProductDao.prototype.getAvailableProducts).toHaveBeenCalledTimes(1) 
        expect(ProductDao.prototype.getAvailableProducts).toHaveBeenCalledWith(grouping,category,null)  
    })
})

describe("productController.deleteAllProducts", () => {
    test("code 200 success", async () => {
        const controller = new ProductController(); 
        jest.spyOn(ProductDao.prototype, "deleteAllProducts").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await controller.deleteAllProducts() //Send a POST request to the route
        expect(response).toBe(true)//Check if the response status is 200
        expect(ProductDao.prototype.deleteAllProducts).toHaveBeenCalledTimes(1)  
    })
})

describe("productController.deleteProduct", () => {
    test("code 200 success", async () => {
        const model = "Iphone13"
        const controller = new ProductController(); 
        jest.spyOn(ProductDao.prototype, "deleteProduct").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await controller.deleteProduct(model) //Send a POST request to the route
        expect(response).toBe(true) //Check if the response status is 200
        expect(ProductDao.prototype.deleteProduct).toHaveBeenCalledTimes(1) 
        expect(ProductDao.prototype.deleteProduct).toHaveBeenCalledWith(model)  
    })
})