import { test, expect, jest, describe, beforeEach } from "@jest/globals"
import Authenticator from "../../src/routers/auth"
import ReviewController from "../../src/controllers/reviewController";
import { ProductReview } from "../../src/components/review";
import { User, Role } from "../../src/components/user"
import ReviewDao from "../../src/dao/reviewDAO"
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

describe("reviewController.AddReview", () => {
    test("Review added", async () =>{
        const mockedComment = ""
        const mockedRate = 5
        const mockedUser = customer1
        const mockedModel = "Iphone13"
        const mockedDate = new Date().toISOString().split('T')[0]
        jest.spyOn(ReviewDao.prototype, "addReview").mockResolvedValueOnce(); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        const response = await controller.addReview(mockedModel,mockedUser,mockedRate, mockedComment);
        expect(response).toBeUndefined()
        expect(ReviewDao.prototype.addReview).toHaveBeenCalledTimes(1);
        expect(ReviewDao.prototype.addReview).toHaveBeenCalledWith(mockedModel,mockedUser.username,mockedRate, mockedDate,mockedComment);
    })
    test("Error 404, Product not in database", async () =>{
      const mockedComment = ""
      const mockedRate = 5
      const mockedUser = customer1
      const mockedModel = "Iphone13"
      const mockedDate = new Date().toISOString().split('T')[0]
      jest.spyOn(ReviewDao.prototype, "addReview").mockRejectedValueOnce(new ProductNotFoundError()); //Mock the createUser method of the DAO
      const controller = new ReviewController(); //Create a new instance of the controller
      await expect(controller.addReview(mockedModel,mockedUser,mockedRate, mockedComment)).rejects.toThrow(new ProductNotFoundError());
      expect(ReviewDao.prototype.addReview).toHaveBeenCalledTimes(1);
      expect(ReviewDao.prototype.addReview).toHaveBeenCalledWith(mockedModel,mockedUser.username,mockedRate, mockedDate,mockedComment);
    })
    test("Error 409, Product not in database", async () =>{
      const mockedComment = ""
      const mockedRate = 5
      const mockedUser = customer1
      const mockedModel = "Iphone13"
      const mockedDate = new Date().toISOString().split('T')[0]
      jest.spyOn(ReviewDao.prototype, "addReview").mockRejectedValueOnce(new ExistingReviewError()); //Mock the createUser method of the DAO
      const controller = new ReviewController(); //Create a new instance of the controller
      await expect(controller.addReview(mockedModel,mockedUser,mockedRate, mockedComment)).rejects.toThrow(new ExistingReviewError());
      expect(ReviewDao.prototype.addReview).toHaveBeenCalledTimes(1);
      expect(ReviewDao.prototype.addReview).toHaveBeenCalledWith(mockedModel,mockedUser.username,mockedRate, mockedDate,mockedComment);
    })
})

describe("reviewController.getProductReviews", () => {
  test("Reviews got successfully", async () =>{
      const mockedModel = "Iphone13"
      jest.spyOn(ReviewDao.prototype, "getProductReviews").mockResolvedValueOnce([review1,review4]); //Mock the createUser method of the DAO
      const controller = new ReviewController(); //Create a new instance of the controller
      const response = await controller.getProductReviews(mockedModel);
      expect(response).toEqual([review1,review4])
      expect(ReviewDao.prototype.getProductReviews).toHaveBeenCalledTimes(1);
      expect(ReviewDao.prototype.getProductReviews).toHaveBeenCalledWith(mockedModel);
  })
})

describe("reviewController.deleteReview", () => {
  test("Deletion done", async () =>{
      const mockedModel = "Iphone13"
      const mockedUser = customer1
      jest.spyOn(ReviewDao.prototype, "deleteReview").mockResolvedValueOnce(); //Mock the createUser method of the DAO
      const controller = new ReviewController(); //Create a new instance of the controller
      const response = await controller.deleteReview(mockedModel,mockedUser);
      expect(response).toBeUndefined();
      expect(ReviewDao.prototype.deleteReview).toHaveBeenCalledTimes(1);
      expect(ReviewDao.prototype.deleteReview).toHaveBeenCalledWith(mockedModel,mockedUser.username);
  })
  test("Error 404, Product not in database", async () =>{
    const mockedUser = customer1
    const mockedModel = "Iphone13"
    jest.spyOn(ReviewDao.prototype, "deleteReview").mockRejectedValueOnce(new ProductNotFoundError()); //Mock the createUser method of the DAO
    const controller = new ReviewController(); //Create a new instance of the controller
    await expect(controller.deleteReview(mockedModel,mockedUser)).rejects.toThrow(new ProductNotFoundError());
    expect(ReviewDao.prototype.deleteReview).toHaveBeenCalledTimes(1);
    expect(ReviewDao.prototype.deleteReview).toHaveBeenCalledWith(mockedModel,mockedUser.username);
  })
  test("Error 404, Product not in database", async () =>{
    const mockedUser = customer1
    const mockedModel = "Iphone13"
    jest.spyOn(ReviewDao.prototype, "deleteReview").mockRejectedValueOnce(new NoReviewProductError()); //Mock the createUser method of the DAO
    const controller = new ReviewController(); //Create a new instance of the controller
    await expect(controller.deleteReview(mockedModel,mockedUser)).rejects.toThrow(new NoReviewProductError());
    expect(ReviewDao.prototype.deleteReview).toHaveBeenCalledTimes(1);
    expect(ReviewDao.prototype.deleteReview).toHaveBeenCalledWith(mockedModel,mockedUser.username);
  })
})

describe("reviewController.deleteReviewsOfProduct", () => {
  test("Deletion all done", async () =>{
      const mockedModel = "Iphone13"
      const mockedUser = manager1
      jest.spyOn(ReviewDao.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce(); //Mock the createUser method of the DAO
      const controller = new ReviewController(); //Create a new instance of the controller
      const response = await controller.deleteReviewsOfProduct(mockedModel);
      expect(response).toBeUndefined();
      expect(ReviewDao.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1);
      expect(ReviewDao.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(mockedModel);
  })
  test("Error 404, Product not in database", async () =>{
    const mockedUser = manager1
    const mockedModel = "Iphone13"
    jest.spyOn(ReviewDao.prototype, "deleteReviewsOfProduct").mockRejectedValueOnce(new ProductNotFoundError()); //Mock the createUser method of the DAO
    const controller = new ReviewController(); //Create a new instance of the controller
    await expect(controller.deleteReviewsOfProduct(mockedModel)).rejects.toThrow(new ProductNotFoundError());
    expect(ReviewDao.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1);
    expect(ReviewDao.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(mockedModel);
  })
})

describe("reviewController.deleteAllReviews", () => {
  test("Deletion all done", async () =>{
      jest.spyOn(ReviewDao.prototype, "deleteAllReviews").mockResolvedValueOnce(); //Mock the createUser method of the DAO
      const controller = new ReviewController(); //Create a new instance of the controller
      const response = await controller.deleteAllReviews();
      expect(response).toBeUndefined();
      expect(ReviewDao.prototype.deleteAllReviews).toHaveBeenCalledTimes(1);
  })
})