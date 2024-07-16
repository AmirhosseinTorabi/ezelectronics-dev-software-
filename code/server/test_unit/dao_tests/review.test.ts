import { test, expect, jest, describe, beforeEach } from "@jest/globals"
import Authenticator from "../../src/routers/auth"
import ReviewController from "../../src/controllers/reviewController";
import { ProductReview } from "../../src/components/review";
import { User, Role } from "../../src/components/user"
import ReviewDAO from "../../src/dao/reviewDAO";
import { Database } from "sqlite3";
import db from "../../src/db/db";
import { UserAlreadyExistsError, UserNotAdminError, UserNotFoundError, BirthdateIsAfterTodayError, UserIsAdminNotModifyError } from "../../src/errors/userError";
import {
    ExistingReviewError,
    NoReviewProductError,
    GenericReviewError
  } from "../../src/errors/reviewError";
  import {
    ProductNotFoundError,
    WrongParameterError,
  } from "../../src/errors/productError";

let admin1 = new User("admin1","admin","admin",Role.ADMIN,"","")
let customer1 = new User("customer1","customer","customer",Role.CUSTOMER,"","")
let customer2 = new User("customer2","customer","customer",Role.CUSTOMER,"","")
let manager1 = new User("manager1","manager","manager",Role.MANAGER,"","")
let review1 = new ProductReview("Iphone13", customer1.username, 1, "2024-06-06","prova1")
let review2 = new ProductReview("Iphone14", customer1.username, 5, "2024-06-06","")
let review3 = new ProductReview("Iphone12", customer1.username, 3, "2024-06-06","")
let review4 = new ProductReview("Iphone13", customer2.username, 1, "2024-06-06","prova2")
let mockedreview1 = {model:"Iphone13", username: "customer1", score: 1, date: "2024-06-06", comment: "prova1"}
let mockedreview4 = {model:"Iphone13", username: "customer2", score: 1, date: "2024-06-06", comment: "prova2"}

beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks()
    //additional `mockClear()` must be placed here
});

describe("reviewDAO.addReview", () => {
    test("Review added", async () =>{
      const reviewDao = new ReviewDAO();
      const mockedComment = ""
      const mockedRate = 5
      const mockedUser = customer1
      const mockedModel = "Iphone13"
      const mockedDate = new Date().toLocaleDateString()
      const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {callback(null);
        return {} as Database;
        });
      const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null,mockedModel);
        return {} as Database;
        });
      const mockDBGet2 = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null,undefined);
        return {} as Database;
        });
      const result = await reviewDao.addReview(mockedModel,mockedUser.username,mockedRate,mockedDate,mockedComment);
      expect(result).toBeUndefined();
      expect(db.get).toHaveBeenCalledTimes(2);
      expect(db.run).toHaveBeenCalledTimes(1);
      expect(db.get).toHaveBeenNthCalledWith(1,expect.any(String),
      [mockedModel],
      expect.any(Function))
      expect(db.get).toHaveBeenNthCalledWith(2,expect.any(String),
      [mockedModel,mockedUser.username],
      expect.any(Function))
      mockDBRun.mockRestore();
      mockDBGet.mockRestore();
      mockDBGet2.mockRestore()
    })
    test("Error 404 - product not in database", async () =>{
      const reviewDao = new ReviewDAO();
      const mockedComment = ""
      const mockedRate = 5
      const mockedUser = customer1
      const mockedModel = "Iphone13"
      const mockedDate = new Date().toLocaleDateString()
      const mockDBRUn = jest.spyOn(db, "run")
      const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null,undefined);
        return {} as Database;
        });
      await expect(reviewDao.addReview(mockedModel,mockedUser.username,mockedRate,mockedDate,mockedComment)).rejects.toThrow(new ProductNotFoundError());
      expect(db.get).toHaveBeenCalledTimes(1);
      expect(db.run).toHaveBeenCalledTimes(0);
      expect(db.get).toHaveBeenCalledWith(expect.any(String),
      [mockedModel],
      expect.any(Function))
      mockDBGet.mockRestore();
      mockDBRUn.mockRestore();
    })
    test("Error 409 - review already published", async () =>{
      const reviewDao = new ReviewDAO();
      const mockedComment = ""
      const mockedRate = 5
      const mockedUser = customer1
      const mockedModel = "Iphone13"
      const mockedDate = new Date().toLocaleDateString()
      const mockDBRUn = jest.spyOn(db, "run")
      const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null,mockedModel);
        return {} as Database;
        });
      const mockDBGet2 = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null,{});
        return {} as Database;
        });
      await expect(reviewDao.addReview(mockedModel,mockedUser.username,mockedRate,mockedDate,mockedComment)).rejects.toThrow(new ExistingReviewError());
      expect(db.get).toHaveBeenCalledTimes(2);
      expect(db.run).toHaveBeenCalledTimes(0);
      expect(db.get).toHaveBeenNthCalledWith(1,expect.any(String),
      [mockedModel],
      expect.any(Function))
      expect(db.get).toHaveBeenNthCalledWith(2,expect.any(String),
      [mockedModel,mockedUser.username],
      expect.any(Function))
      mockDBGet.mockRestore();
      mockDBRUn.mockRestore();
      mockDBGet2.mockRestore();
    })
    test("Database error add review 1", async () => {
      const reviewDao = new ReviewDAO();
      const mockedComment = ""
      const mockedRate = 5
      const mockedUser = customer1
      const mockedModel = "Iphone13"
      const mockedDate = new Date().toLocaleDateString()
        const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
          callback(new Error("Database error"),undefined);
          return {} as Database;
          });
        await expect(reviewDao.addReview(mockedModel,mockedUser.username,mockedRate,mockedDate,mockedComment)).rejects.toThrow(new Error("Database error"))
        mockDBGet.mockRestore();
    })
    test("Database error add review 2", async () => {
      const reviewDao = new ReviewDAO();
      const mockedComment = ""
      const mockedRate = 5
      const mockedUser = customer1
      const mockedModel = "Iphone13"
      const mockedDate = new Date().toLocaleDateString()
      const mockDBRUn = jest.spyOn(db, "run")
      const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null,mockedModel);
        return {} as Database;
        });
      const mockDBGet2 = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(new Error("Database error"),undefined);
        return {} as Database;
        });
      await expect(reviewDao.addReview(mockedModel,mockedUser.username,mockedRate,mockedDate,mockedComment)).rejects.toThrow(new Error("Database error"));
      expect(db.get).toHaveBeenCalledTimes(2);
      expect(db.run).toHaveBeenCalledTimes(0);
      expect(db.get).toHaveBeenNthCalledWith(1,expect.any(String),
      [mockedModel],
      expect.any(Function))
      expect(db.get).toHaveBeenNthCalledWith(2,expect.any(String),
      [mockedModel,mockedUser.username],
      expect.any(Function))
      mockDBGet.mockRestore();
      mockDBRUn.mockRestore();
      mockDBGet2.mockRestore();
    })
    test("Database error add review 3", async () => {
      const reviewDao = new ReviewDAO();
      const mockedComment = ""
      const mockedRate = 5
      const mockedUser = customer1
      const mockedModel = "Iphone13"
      const mockedDate = new Date().toLocaleDateString()
      const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(new Error("Database error"));
        return {} as Database;
        });
      const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null,mockedModel);
        return {} as Database;
        });
      const mockDBGet2 = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null,undefined);
        return {} as Database;
        });
      await expect(reviewDao.addReview(mockedModel,mockedUser.username,mockedRate,mockedDate,mockedComment)).rejects.toThrow(new Error("Database error"));
      expect(db.get).toHaveBeenCalledTimes(2);
      expect(db.run).toHaveBeenCalledTimes(1);
      expect(db.get).toHaveBeenNthCalledWith(1,expect.any(String),
      [mockedModel],
      expect.any(Function))
      expect(db.get).toHaveBeenNthCalledWith(2,expect.any(String),
      [mockedModel,mockedUser.username],
      expect.any(Function))
      mockDBGet.mockRestore();
      mockDBRun.mockRestore();
      mockDBGet2.mockRestore();
    })
})

describe("reviewDAO.getProductReviews", () =>{
  test("get reviews", async () => {
    const reviewDao = new ReviewDAO();
      const mockedComment = ""
      const mockedRate = 5
      const mockedUser = customer1
      const mockedModel = "Iphone13"
      const mockedDate = new Date().toLocaleDateString()
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => 
        {callback(null,'Iphone13');
        return {} as Database;
        });
      const mockDBRun = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => 
        {callback(null,[mockedreview1,mockedreview4]);
        return {} as Database;
        });
      const result = await reviewDao.getProductReviews(mockedModel);
      expect(result).toEqual([review1,review4])
      expect(db.all).toHaveBeenNthCalledWith(1,expect.any(String),
      [mockedModel],
      expect.any(Function))
      mockDBRun.mockRestore();
      mockDBGet.mockRestore();
  })
})

describe("reviewDAO.deleteReview", () =>{
  test("Review deleted", async () => {
    const reviewDao = new ReviewDAO();
      const mockedUser = customer1
      const mockedModel = "Iphone13"
      const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null,mockedModel);
        return {} as Database;
        });
      const mockDBGet2 = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
          callback(null,{});
          return {} as Database;
          });
      const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => 
        {callback(null);
        return {} as Database;
        });
      const result = await reviewDao.deleteReview(mockedModel,mockedUser.username);
      expect(result).toBeUndefined()
      expect(db.get).toHaveBeenNthCalledWith(1,expect.any(String),
      [mockedModel],
      expect.any(Function))
      expect(db.get).toHaveBeenNthCalledWith(2,expect.any(String),
      [mockedModel,mockedUser.username],
      expect.any(Function))
      mockDBRun.mockRestore();
      mockDBGet.mockRestore();
      mockDBGet2.mockRestore();
  })
  test("Error 404 - model does not exist", async () => {
    const reviewDao = new ReviewDAO();
      const mockedUser = customer1
      const mockedModel = "Iphone15"
      const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null,undefined);
        return {} as Database;
        });
      await expect(reviewDao.deleteReview(mockedModel,mockedUser.username)).rejects.toThrow(new ProductNotFoundError())
      expect(db.get).toHaveBeenNthCalledWith(1,expect.any(String),
      [mockedModel],
      expect.any(Function))
      mockDBGet.mockRestore();
  })
  test("Error 404 - User has no review", async () => {
    const reviewDao = new ReviewDAO();
      const mockedUser = customer1
      const mockedModel = "Iphone13"
      const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null,mockedModel);
        return {} as Database;
        });
      const mockDBGet2 = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
          callback(null,undefined);
          return {} as Database;
          });
      await expect(reviewDao.deleteReview(mockedModel,mockedUser.username)).rejects.toThrow(new NoReviewProductError());
      expect(db.get).toHaveBeenNthCalledWith(1,expect.any(String),
      [mockedModel],
      expect.any(Function))
      expect(db.get).toHaveBeenNthCalledWith(2,expect.any(String),
      [mockedModel,mockedUser.username],
      expect.any(Function))
      mockDBGet.mockRestore();
      mockDBGet2.mockRestore();
  })
})

describe("reviewDAO.deleteReviewsOfProduct", () =>{
  test("Reviews deleted", async () => {
    const reviewDao = new ReviewDAO();
      const mockedUser = customer1
      const mockedModel = "Iphone13"
      const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null,mockedModel);
        return {} as Database;
        });
      const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => 
        {callback(null);
        return {} as Database;
        });
      const result = await reviewDao.deleteReviewsOfProduct(mockedModel);
      expect(result).toBeUndefined()
      expect(db.get).toHaveBeenNthCalledWith(1,expect.any(String),
      [mockedModel],
      expect.any(Function))
      mockDBRun.mockRestore();
      mockDBGet.mockRestore();
  })
  test("Error 404 - model does not exist", async () => {
    const reviewDao = new ReviewDAO();
      const mockedUser = customer1
      const mockedModel = "Iphone15"
      const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null,undefined);
        return {} as Database;
        });
      await expect(reviewDao.deleteReviewsOfProduct(mockedModel)).rejects.toThrow(new ProductNotFoundError())
      expect(db.get).toHaveBeenNthCalledWith(1,expect.any(String),
      [mockedModel],
      expect.any(Function))
      mockDBGet.mockRestore();
  })
  test("Database error delete all reviews 1 product - 1", async () => {
    const reviewDao = new ReviewDAO();
      const mockedUser = customer1
      const mockedModel = "Iphone15"
      const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(new Error("Database error"),undefined);
        return {} as Database;
        });
      await expect(reviewDao.deleteReviewsOfProduct(mockedModel)).rejects.toThrow(new Error("Database error"))
      expect(db.get).toHaveBeenNthCalledWith(1,expect.any(String),
      [mockedModel],
      expect.any(Function))
      mockDBGet.mockRestore();
  })
  test("Database error delete all reviews 1 product - 2", async () => {
    const reviewDao = new ReviewDAO();
      const mockedUser = customer1
      const mockedModel = "Iphone15"
      const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null,mockedModel);
        return {} as Database;
        });
      const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => 
        {callback(new Error("Database error"));
        return {} as Database;
        });
      await expect(reviewDao.deleteReviewsOfProduct(mockedModel)).rejects.toThrow(new Error("Database error"))
      expect(db.get).toHaveBeenNthCalledWith(1,expect.any(String),
      [mockedModel],
      expect.any(Function))
      mockDBGet.mockRestore();
      mockDBRun.mockRestore();
  })
})

describe("reviewDAO.deleteAllReviews", () => {
  test("Deleted all reviews", async() => {
    const reviewDao = new ReviewDAO();
      const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => 
        {callback(null);
        return {} as Database;
        });
      const result = await reviewDao.deleteAllReviews();
      expect(result).toBeUndefined()
      expect(db.run).toHaveBeenCalledTimes(1);
      mockDBRun.mockRestore();
  })
  test("Database error", async () => {
    const reviewDao = new ReviewDAO();
      const mockedUser = customer1
      const mockedModel = "Iphone15"
      const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql,callback) => {
        callback(new Error("Database error"));
        return {} as Database;
        });
      await expect(reviewDao.deleteAllReviews()).rejects.toThrow(new Error("Database error"))
      expect(db.run).toHaveBeenNthCalledWith(1,expect.any(String),
      expect.any(Function))
      mockDBRun.mockRestore();
  })
})