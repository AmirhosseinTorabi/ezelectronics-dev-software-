import { test, expect, jest, describe, beforeEach} from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { User, Role } from "../../src/components/user"
import { ProductNotFoundError, EmptyProductStockError, LowProductStockError, ProductAlreadyExistsError, SellingDateError, WrongParameterError } from "../../src/errors/productError"
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError"
import ProductController from "../../src/controllers/productController"
import { Product, Category } from "../../src/components/product";
import Authenticator from "../../src/routers/auth"
const baseURL = "/ezelectronics"

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

describe("POST ezelectronics/products", () => {
    test("code 200 success", async () => {
        const mockedBody = {
            model: "Iphone13",
            category: Category.SMARTPHONE,
            quantity: 10,
            details: "",
            sellingPrice: 200.50,
            arrivalDate: "2024-06-07"
        }
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await request(app).post(baseURL + "/products").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(mockedBody.model,mockedBody.category,mockedBody.quantity,mockedBody.details,mockedBody.sellingPrice,mockedBody.arrivalDate)  
    })
    test("error 409, model already exists", async () => {
        const mockedBody = {
            model: "Iphone13",
            category: Category.SMARTPHONE,
            quantity: 10,
            details: "",
            sellingPrice: 200.50,
            arrivalDate: "2024-06-07"
        }
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(new ProductAlreadyExistsError()) //Mock the createUser method of the controller
        const response = await request(app).post(baseURL + "/products").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(409) //Check if the response status is 200
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(mockedBody.model,mockedBody.category,mockedBody.quantity,mockedBody.details,mockedBody.sellingPrice,mockedBody.arrivalDate)  
    })
    test("error 400, arrival date wrong", async () => {
        const mockedBody = {
            model: "Iphone13",
            category: Category.SMARTPHONE,
            quantity: 10,
            details: "",
            sellingPrice: 200.50,
            arrivalDate: "2024-06-07"
        }
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(new SellingDateError()) //Mock the createUser method of the controller
        const response = await request(app).post(baseURL + "/products").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(400) //Check if the response status is 200
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(mockedBody.model,mockedBody.category,mockedBody.quantity,mockedBody.details,mockedBody.sellingPrice,mockedBody.arrivalDate)  
    })
    test("code 200 success, without passing arrivalDate", async () => {
        const mockedBody = {
            model: "Iphone13",
            category: Category.SMARTPHONE,
            quantity: 10,
            details: "",
            sellingPrice: 200.50,
        }
        const mockedDate = "2024-06-08"
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await request(app).post(baseURL + "/products").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(mockedBody.model,mockedBody.category,mockedBody.quantity,mockedBody.details,mockedBody.sellingPrice,null)  
    })
})

describe("PATCH ezelectronics/products/:model", () => {
    test("code 200 success", async () => {
        const mockedBody = {
            quantity: 10,
            changeDate: "2024-06-07"
        }
        const mockedResponse =  12
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(mockedResponse) //Mock the createUser method of the controller
        const response = await request(app).patch(baseURL + "/products/Iphone13").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith("Iphone13",mockedBody.quantity,mockedBody.changeDate)  
    })
    test("error 404, model already exists", async () => {
        const mockedBody = {
            quantity: 10,
            changeDate: "2024-06-07"
        }
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new ProductNotFoundError()) //Mock the createUser method of the controller
        const response = await request(app).patch(baseURL + "/products/Iphone13").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(404) //Check if the response status is 200
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith("Iphone13",mockedBody.quantity,mockedBody.changeDate)  
    })
    test("error 400, changeDate is after the current date", async () => {
        const mockedBody = {
            quantity: 10,
            changeDate: "2024-06-07"
        }
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new SellingDateError()) //Mock the createUser method of the controller
        const response = await request(app).patch(baseURL + "/products/Iphone13").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(400) //Check if the response status is 200
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith("Iphone13",mockedBody.quantity,mockedBody.changeDate)  
    })
    test("code 200 success, without passing changeDate", async () => {
        const mockedBody = {
            quantity: 10,
        }
        const mockedResponse =  12
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(mockedResponse) //Mock the createUser method of the controller
        const response = await request(app).patch(baseURL + "/products/Iphone13").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith("Iphone13",mockedBody.quantity,null)  
    })
    test("error 401, no logged in", async () => {
        const mockedBody = {
            quantity: 10,
            changeDate: "2024-06-07"
        }
        jest.spyOn(ProductController.prototype, "changeProductQuantity")
        const response = await request(app).patch(baseURL + "/products/Iphone13").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(401) //Check if the response status is 200
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0)  
    })
})

describe("PATCH ezelectronics/products/:model/sell", () => {
    test("code 200 success", async () => {
        const mockedBody = {
            quantity: 10,
            sellingDate: "2024-06-07"
        }
        const mockedResponse =  12
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce() 
        const response = await request(app).patch(baseURL + "/products/Iphone13/sell").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("Iphone13",mockedBody.quantity,mockedBody.sellingDate)  
    })
    test("error 404, model not found", async () => {
        const mockedBody = {
            quantity: 10,
            sellingDate: "2024-06-07"
        }
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new ProductNotFoundError()) //Mock the createUser method of the controller
        const response = await request(app).patch(baseURL + "/products/Iphone13/sell").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(404) //Check if the response status is 200
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("Iphone13",mockedBody.quantity,mockedBody.sellingDate)  
    })
    test("error 400, selling date is wrong", async () => {
        const mockedBody = {
            quantity: 10,
            sellingDate: "2024-06-07"
        }
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new SellingDateError()) //Mock the createUser method of the controller
        const response = await request(app).patch(baseURL + "/products/Iphone13/sell").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(400) //Check if the response status is 200
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("Iphone13",mockedBody.quantity,mockedBody.sellingDate)  
    })
    test("code 200 success, without passing changeDate", async () => {
        const mockedBody = {
            quantity: 10,
        }
        const mockedResponse =  12
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce() //Mock the createUser method of the controller
        const response = await request(app).patch(baseURL + "/products/Iphone13/sell").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("Iphone13",mockedBody.quantity,null)  
    })
    test("error 401, no logged in", async () => {
        const mockedBody = {
            quantity: 10,
            sellingDate: "2024-06-07"
        }
        jest.spyOn(ProductController.prototype, "sellProduct")
        const response = await request(app).patch(baseURL + "/products/Iphone13/sell").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(401) //Check if the response status is 200
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(0)  
    })
    test("error 409, model not available", async () => {
        const mockedBody = {
            quantity: 10,
            sellingDate: "2024-06-07"
        }
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new EmptyProductStockError()) //Mock the createUser method of the controller
        const response = await request(app).patch(baseURL + "/products/Iphone13/sell").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(409) //Check if the response status is 200
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("Iphone13",mockedBody.quantity,mockedBody.sellingDate)  
    })
    test("error 409, available quantity of model is lower than the requested quantity", async () => {
        const mockedBody = {
            quantity: 10,
            sellingDate: "2024-06-07"
        }
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new LowProductStockError()) //Mock the createUser method of the controller
        const response = await request(app).patch(baseURL + "/products/Iphone13/sell").send(mockedBody) //Send a POST request to the route
        expect(response.status).toBe(409) //Check if the response status is 200
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("Iphone13",mockedBody.quantity,mockedBody.sellingDate)  
    })
})

describe("GET ezelectronics/products", ()=>{
    test("code 200", async ()=>{
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([product1,product2]) 
        const response = await request(app).get(baseURL + "/products/?grouping=category&category=Smartphone&").send() //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("category","Smartphone",null) 
    })
    test("error 422, wrong parameters", async ()=>{
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValueOnce(new WrongParameterError()) 
        const response = await request(app).get(baseURL + "/products/?grouping=category&category=Smartphone&model=Giovanni").send() //Send a POST request to the route
        expect(response.status).toBe(422) //Check if the response status is 200
        expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("category","Smartphone","Giovanni") 
    })

    test("code 404, model does not exist", async ()=>{
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValueOnce(new ProductNotFoundError()) 
        const response = await request(app).get(baseURL + "/products?grouping=model&model=Iphone13&").send() //Send a POST request to the route
        expect(response.status).toBe(404) //Check if the response status is 200
        expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("model",null,"Iphone13") 
    })
    test("code 401, no logged in", async ()=>{
        jest.spyOn(ProductController.prototype, "getProducts")
        const response = await request(app).get(baseURL + "/products?grouping=model&model=Iphone13&").send() //Send a POST request to the route
        expect(response.status).toBe(401) //Check if the response status is 200
        expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0) 
    })
    test("code 200, returned all product", async ()=>{
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([product1,product2]) 
        const response = await request(app).get(baseURL + "/products/").send() //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(null,null,null) 
    })
})

describe("GET ezelectronics/products/available", ()=>{
    test("code 200", async ()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([product1,product2]) 
        const response = await request(app).get(baseURL + "/products/available?grouping=category&category=Smartphone&").send() //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith("category","Smartphone",null) 
    })
    test("error 422, wrong parameters", async ()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(new WrongParameterError()) 
        const response = await request(app).get(baseURL + "/products/available?grouping=category&category=Smartphone&model=Giovanni").send() //Send a POST request to the route
        expect(response.status).toBe(422) //Check if the response status is 200
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith("category","Smartphone","Giovanni") 
    })

    test("code 404, model does not exist", async ()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(new ProductNotFoundError()) 
        const response = await request(app).get(baseURL + "/products/available?grouping=model&model=Iphone13&").send() //Send a POST request to the route
        expect(response.status).toBe(404) //Check if the response status is 200
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith("model",null,"Iphone13") 
    })
    test("code 401, no logged in", async ()=>{
        jest.spyOn(ProductController.prototype, "getAvailableProducts")
        const response = await request(app).get(baseURL + "/products/available?grouping=model&model=Iphone13&").send() //Send a POST request to the route
        expect(response.status).toBe(401) //Check if the response status is 200
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0) 
    })
    test("code 200, returned all product", async ()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([product1,product2]) 
        const response = await request(app).get(baseURL + "/products/available").send() //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(null,null,null) 
    })
})

describe("DELETE ezelectronics/products/:model", () => {
    test("success 200", async () => {
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = manager1;
            return next()})
        jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true) 
        const response = await request(app).delete(baseURL + "/products/Iphone13").send() //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith("Iphone13")
    })
    test("code 404, model does not exist", async ()=>{
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValueOnce(new ProductNotFoundError()) 
        const response = await request(app).delete(baseURL + "/products/Iphone13").send() //Send a POST request to the route
        expect(response.status).toBe(404) //Check if the response status is 200
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1) 
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith("Iphone13")
    })
    test("code 401, no logged in", async ()=>{
        jest.spyOn(ProductController.prototype, "deleteProduct")
        const response = await request(app).delete(baseURL + "/products/Iphone13").send() //Send a POST request to the route
        expect(response.status).toBe(401) //Check if the response status is 200
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(0) 
    })
})

describe("DELETE ezelectronics/products", () => {
    test("success 200", async () => {
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = manager1;
            return next()})
        jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true) 
        const response = await request(app).delete(baseURL + "/products").send() //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(1) 
    })
    test("code 404, model does not exist", async ()=>{
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ProductController.prototype, "deleteAllProducts").mockRejectedValueOnce(new ProductNotFoundError()) 
        const response = await request(app).delete(baseURL + "/products").send() //Send a POST request to the route
        expect(response.status).toBe(404) //Check if the response status is 200
        expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(1) 
    })
    test("code 401, no logged in", async ()=>{
        jest.spyOn(ProductController.prototype, "deleteAllProducts")
        const response = await request(app).delete(baseURL + "/products").send() //Send a POST request to the route
        expect(response.status).toBe(401) //Check if the response status is 200
        expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(0) 
    })
})