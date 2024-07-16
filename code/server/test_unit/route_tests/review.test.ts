import { test, expect, jest, describe, beforeEach} from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { User, Role } from "../../src/components/user"
import { UserAlreadyExistsError, UserNotAdminError, UserNotFoundError, BirthdateIsAfterTodayError, UserIsAdminNotModifyError } from "../../src/errors/userError";
import UserController from "../../src/controllers/userController"
import Authenticator from "../../src/routers/auth"
import ReviewController from "../../src/controllers/reviewController";
import { ProductReview } from "../../src/components/review";
const baseURL = "/ezelectronics"

import {
    ExistingReviewError,
    NoReviewProductError,
    GenericReviewError
  } from "../../src/errors/reviewError";
  import {
    ProductNotFoundError,
    WrongParameterError,
    SellingDateError,
    LowProductStockError,
    ProductSoldError,
  } from "../../src/errors/productError";
//Example of a unit test for the POST ezelectronics/users route
//The test checks if the route returns a 200 success code
//The test also expects the createUser method of the controller to be called once with the correct parameters

let admin1 = new User("admin1","admin","admin",Role.ADMIN,"","")
let customer1 = new User("customer1","customer","customer",Role.CUSTOMER,"","")
let customer2 = new User("customer1","customer","customer",Role.CUSTOMER,"","")
let manager1 = new User("manager1","manager","manager",Role.MANAGER,"","")
let review1 = new ProductReview("Iphone13", customer1.username, 1, "2024-06-06","")
let review2 = new ProductReview("Iphone14", customer1.username, 5, "2024-06-06","")
let review3 = new ProductReview("Iphone12", customer1.username, 3, "2024-06-06","")
let review4 = new ProductReview("Iphone13", customer2.username, 1, "2024-06-06","")


beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks()
    //additional `mockClear()` must be placed here
});

describe("POST ezelectronics/reviews/:model", () => {
    
        test("It should return a 200 success code", async () => {
            const testComment = { //Define a test user object sent to the route
                score: 1,
                comment: "test",
            }
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
                req.user = customer1;
                return next()})
            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce() //Mock the createUser method of the controller
            const response = await request(app).post(baseURL + "/reviews/Iphone13").send(testComment) //Send a POST request to the route
            expect(response.status).toBe(200) //Check if the response status is 200
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1) 
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith("Iphone13",customer1,testComment.score,
                testComment.comment)
        })
        test("It should return a 404 error code, model not in database", async () => {
            const testComment = { //Define a test user object sent to the route
                score: 1,
                comment: "test",
            }
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
                req.user = customer1;
                return next()})
            jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(new ProductNotFoundError()) //Mock the createUser method of the controller
            const response = await request(app).post(baseURL + "/reviews/Iphone1000").send(testComment) //Send a POST request to the route
            expect(response.status).toBe(404) 
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1) 
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith("Iphone1000",customer1,testComment.score,
                testComment.comment)
        })
        test("It should return a 409 error code, existing review", async () => {
            const testComment = { //Define a test user object sent to the route
                score: 1,
                comment: "test",
            }
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
                req.user = customer1;
                return next()})
            jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(new ExistingReviewError()) //Mock the createUser method of the controller
            const response = await request(app).post(baseURL + "/reviews/Iphone13").send(testComment) //Send a POST request to the route
            expect(response.status).toBe(409) //Check if the response status is 200
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
            //Check if the createUser method has been called with the correct parameters
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith("Iphone13",customer1,testComment.score,
                testComment.comment)
        })
        test("It should return a 422 error code, wrong parameters 1", async () => {
            const testComment = { //Define a test user object sent to the route
                score: 12,
                comment: "test",
            }
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
                req.user = customer1;
                return next()})
            jest.spyOn(ReviewController.prototype, "addReview")
            const response = await request(app).post(baseURL + "/reviews/Iphone13").send(testComment) 
            expect(response.status).toBe(422) 
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(0) 
            
        })
        test("It should return a 422 error code, wrong parameters 2", async () => {
            const testComment = { 
                score: 3,
                
            }
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
                req.user = customer1;
                return next()})
            jest.spyOn(ReviewController.prototype, "addReview") 
            const response = await request(app).post(baseURL + "/reviews/Iphone13").send(testComment)
            expect(response.status).toBe(422) 
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(0) 
        })
        test("It should return a 422 success code, empty comment", async () => {
            const testComment = { 
                score: 1,
                comment: "",
            }
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
                req.user = customer1;
                return next()})
            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce() //Mock the createUser method of the controller
            const response = await request(app).post(baseURL + "/reviews/Iphone13").send(testComment) //Send a POST request to the route
            expect(response.status).toBe(422) 
            //expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1)
            //expect(ReviewController.prototype.addReview).toHaveBeenCalledWith("Iphone13",customer1,testComment.score,
            //    testComment.comment)
        })
})

describe("GET ezelectronics/reviews/:model", () => {
    test("it should return 200 - specific model reviews returned", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValueOnce([review1,review4]) //Mock the createUser method of the controller
        const response = await request(app).get(baseURL + "/reviews/Iphone13").send() //Send a POST request to the route
        expect(response.status).toBe(200) 
        expect(response.body).toEqual([review1,review4])
        expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledTimes(1)
        expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith("Iphone13")
    })
    test("it should return 401 - user not logged", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {return res.status(401).json({ error: "Unauthorized" })})
        jest.spyOn(ReviewController.prototype, "getProductReviews")
        const response = await request(app).get(baseURL + "/reviews/Iphone13").send() //Send a POST request to the route
        expect(response.status).toBe(401) 
        expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledTimes(0)
    })
})

describe("DELETE ezelectronics/reviews/:model", () => {
    test("it should return 200 - specific model reviews returned", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce() 
        const response = await request(app).delete(baseURL + "/reviews/Iphone13").send() //Send a POST request to the route
        expect(response.status).toBe(200) 
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1)
        expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1)
        expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith("Iphone13",customer1)
    })
    test("it should return 401 - user not logged", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {return res.status(401).json({ error: "Unauthorized" })})
        jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce() 
        const response = await request(app).delete(baseURL + "/reviews/Iphone13").send() //Send a POST request to the route
        expect(response.status).toBe(401) 
        expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(0)
    })
    test("It should return a 404 error code, model not in database", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValueOnce(new ProductNotFoundError()) 
        const response = await request(app).delete(baseURL + "/reviews/Iphone00").send() //Send a POST request to the route
        expect(response.status).toBe(404) 
        expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
        expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith("Iphone00",customer1)
    })
    test("It should return a 404 error code, no review in db", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValueOnce(new NoReviewProductError()) 
        const response = await request(app).delete(baseURL + "/reviews/Iphone13").send() //Send a POST request to the route
        expect(response.status).toBe(404) 
        expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1)
        expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith("Iphone13",customer1)
    })
})

describe("DELETE ezelectronics/reviews/:model/all", () => {
    test("it should return 200 - specific model reviews deleted", async () => {
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce() 
        const response = await request(app).delete(baseURL + "/reviews/Iphone13/all").send() //Send a POST request to the route
        expect(response.status).toBe(200) 
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)
        expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1)
        expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith("Iphone13")
    })
    test("it should return 401 - user not logged", async () => {
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {return res.status(401).json({ error: "Unauthorized" })})
        jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce() 
        const response = await request(app).delete(baseURL + "/reviews/Iphone13/all").send() //Send a POST request to the route
        expect(response.status).toBe(401) 
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)
        expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(0)
    })
    test("It should return a 404 error code, model not in database", async () => {
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = manager1;
            return next()})
        jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockRejectedValueOnce(new ProductNotFoundError()) 
        const response = await request(app).delete(baseURL + "/reviews/Iphone00/all").send() //Send a POST request to the route
        expect(response.status).toBe(404) 
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)
        expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
        expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith("Iphone00")
    })
})

describe("DELETE ezelectronics/reviews", () => {
    test("it should return 200 - all reviews deleted", async () => {
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce() 
        const response = await request(app).delete(baseURL + "/reviews").send() //Send a POST request to the route
        expect(response.status).toBe(200) 
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)
        expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledTimes(1)
    })
    test("it should return 401 - user not logged", async () => {
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req,res,next) =>  {return res.status(401).json({ error: "Unauthorized" })})
        jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce() 
        const response = await request(app).delete(baseURL + "/reviews").send() //Send a POST request to the route
        expect(response.status).toBe(401) 
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)
        expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledTimes(0)
    })
})

