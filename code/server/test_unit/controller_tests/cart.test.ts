import { test, expect, jest, describe, beforeEach} from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { User, Role } from "../../src/components/user"
import { ProductNotFoundError, EmptyProductStockError, LowProductStockError } from "../../src/errors/productError"
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError"
import { Cart,ProductInCart } from "../../src/components/cart";
import {Category} from "../../src/components/product"
import CartDao from "../../src/dao/cartDAO"
import CartController from "../../src/controllers/cartController";

let customer1 = new User("customer1","customer","customer",Role.CUSTOMER,"","")
let mockedPruductInCart = [new ProductInCart("Iphone13",1,Category.SMARTPHONE,100),new ProductInCart("Iphone10",1,Category.SMARTPHONE,100)]

// @ts-ignore 
let mockedCart = new Cart(customer1.username,false,null,200,mockedPruductInCart)
// @ts-ignore
let mockedCart1 = new Cart(customer1.username,false,null,200,mockedPruductInCart)

// @ts-ignore 
let PaydmockedCart = new Cart(customer1.username,false,"2024-06-08",200,mockedPruductInCart)
// @ts-ignore
let PaydmockedCart1 = new Cart(customer1.username,false,"2024-06-08",200,mockedPruductInCart)

beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks()
    //additional `mockClear()` must be placed here
});

describe("cartController.getCart", () => {
    test("code 200, current cart returned", async () => {
        jest.spyOn(CartDao.prototype, "getCurrentCart").mockResolvedValueOnce(mockedCart) //Mock the createUser method of the controller
        const controller = new CartController(); 
        const response = await controller.getCart(customer1)
        expect(response).toEqual(mockedCart)
        expect(CartDao.prototype.getCurrentCart).toHaveBeenCalledTimes(1) 
        expect(CartDao.prototype.getCurrentCart).toHaveBeenCalledWith(customer1)  
    })
})

describe("cartController.addToCart", () => {
    test("code 200, model added", async () => {
        jest.spyOn(CartDao.prototype, "addProduct").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const controller = new CartController(); 
        const mockModel = "Iphone13"
        const response = await controller.addToCart(customer1,mockModel)
        expect(response).toBe(true)
        expect(CartDao.prototype.addProduct).toHaveBeenCalledTimes(1) 
        expect(CartDao.prototype.addProduct).toHaveBeenCalledWith(customer1,"Iphone13")  
    })
    test("code 404, model does not exist", async () => {
        jest.spyOn(CartDao.prototype, "addProduct").mockRejectedValueOnce(new ProductNotFoundError()) //Mock the createUser method of the controller
        const controller = new CartController(); 
        const mockModel = "Iphone13"
        await expect(controller.addToCart(customer1,mockModel)).rejects.toThrow(new ProductNotFoundError())
        expect(CartDao.prototype.addProduct).toHaveBeenCalledTimes(1) 
    })
    test("code 409, model not available", async () => {
        jest.spyOn(CartDao.prototype, "addProduct").mockRejectedValueOnce(new EmptyProductStockError()) //Mock the createUser method of the controller
        const controller = new CartController(); 
        const mockModel = "Iphone13"
        await expect(controller.addToCart(customer1,mockModel)).rejects.toThrow(new EmptyProductStockError())
        expect(CartDao.prototype.addProduct).toHaveBeenCalledTimes(1)  
    })
})

describe("cartController.checkoutCart", () => {
    test("code 200, checked out", async () => {
        jest.spyOn(CartDao.prototype, "checkoutCart").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const controller = new CartController(); 
        const response = await controller.checkoutCart(customer1)
        expect(response).toBe(true)
        expect(CartDao.prototype.checkoutCart).toHaveBeenCalledTimes(1) 
        expect(CartDao.prototype.checkoutCart).toHaveBeenCalledWith(customer1)  
    })
})

describe("cartController.getCustomerCarts", () => {
    test("code 200, cart history returned", async () => {
        jest.spyOn(CartDao.prototype, "getCustomerCart").mockResolvedValueOnce([PaydmockedCart,PaydmockedCart1]) //Mock the createUser method of the controller
        const controller = new CartController(); 
        const response = await controller.getCustomerCarts(customer1)
        expect(response).toEqual([PaydmockedCart,PaydmockedCart1])
        expect(CartDao.prototype.getCustomerCart).toHaveBeenCalledTimes(1) 
        expect(CartDao.prototype.getCustomerCart).toHaveBeenCalledWith(customer1)  
    })
})

describe("cartController.removeProductFromCart", () => {
    test("code 200, product removed", async () => {
        jest.spyOn(CartDao.prototype, "removeProductFromCart").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const controller = new CartController(); 
        const response = await controller.removeProductFromCart(customer1,"Iphone13")
        expect(response).toBe(true)
        expect(CartDao.prototype.removeProductFromCart).toHaveBeenCalledTimes(1) 
        expect(CartDao.prototype.removeProductFromCart).toHaveBeenCalledWith(customer1,"Iphone13")  
    })
})

describe("cartController.clearCart", () => {
    test("code 200, cart cleared", async () => {
        jest.spyOn(CartDao.prototype, "clearUserCart").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const controller = new CartController(); 
        const response = await controller.clearCart(customer1)
        expect(response).toBe(true)
        expect(CartDao.prototype.clearUserCart).toHaveBeenCalledTimes(1) 
        expect(CartDao.prototype.clearUserCart).toHaveBeenCalledWith(customer1)  
    })
})

describe("cartController.deleteAllCarts", () => {
    test("code 200,all carts deleted", async () => {
        jest.spyOn(CartDao.prototype, "deleteAllCarts").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const controller = new CartController(); 
        const response = await controller.deleteAllCarts()
        expect(response).toBe(true)
        expect(CartDao.prototype.deleteAllCarts).toHaveBeenCalledTimes(1) 
    })
})

describe("cartController.getAllCarts", () => {
    test("code 200, carts returned", async () => {
        jest.spyOn(CartDao.prototype, "getAllCarts").mockResolvedValueOnce([PaydmockedCart,PaydmockedCart1]) //Mock the createUser method of the controller
        const controller = new CartController(); 
        const response = await controller.getAllCarts()
        expect(response).toEqual([PaydmockedCart,PaydmockedCart1])
        expect(CartDao.prototype.getAllCarts).toHaveBeenCalledTimes(1) 
          
    })
})