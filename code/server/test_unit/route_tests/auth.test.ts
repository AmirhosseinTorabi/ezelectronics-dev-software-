import { test, expect, jest, describe, beforeEach, beforeAll} from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import ErrorHandler from "../../src/helper"
import { User, Role } from "../../src/components/user"
import UserController from "../../src/controllers/userController"
import Authenticator from "../../src/routers/auth"
const session = require('express-session')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const baseURL = "/ezelectronics/sessions"

let admin1 = new User("admin1","admin","admin",Role.ADMIN,"","")
let customer1 = new User("customer1","customer","customer",Role.CUSTOMER,"","")
let manager1 = new User("manager1","manager","manager",Role.MANAGER,"","")
let admin2 = new User("admin2","admin","admin",Role.ADMIN,"","")


beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks()
    //additional `mockClear()` must be placed here
});


describe("Login - POST ezelectronics/sessions", () => {
    test("it should return 200, successfull login", async () => {
        const req = {
            body: {
                username: 'customer1',
                password: 'password',
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();
        jest.spyOn(Authenticator.prototype, "login").mockResolvedValueOnce(customer1)
        const response = await request(app).post(baseURL + "/").send(req.body)
        expect(response.status).toBe(200)
        expect(Authenticator.prototype.login).toHaveBeenCalled()
        
    })
    test("it should return error 422, wrong body content - empty username", async () => {
        const req = {
            body: {
                username: '',
                password: 'password',
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();
        jest.spyOn(Authenticator.prototype, "login")
        const response = await request(app).post(baseURL + "/").send(req.body)
        expect(response.status).toBe(422)
        expect(Authenticator.prototype.login).toHaveBeenCalledTimes(0)
    })
    test("it should return error 422, wrong body content - empty password", async () => {
        const req = {
            body: {
                username: 'username',
                password: '',
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();
        jest.spyOn(Authenticator.prototype, "login")
        const response = await request(app).post(baseURL + "/").send(req.body)
        expect(response.status).toBe(422)
        expect(Authenticator.prototype.login).toHaveBeenCalledTimes(0)
    })
    test("it should return error 401, user does not exist", async () => {
        const req = {
            body: {
                username: 'username00000000',
                password: 'password',
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();
        jest.spyOn(Authenticator.prototype, "login").mockRejectedValueOnce(new Error("Incorrect username and/or password"))
        const response = await request(app).post(baseURL + "/").send(req.body)
        expect(response.status).toBe(401)
        expect(Authenticator.prototype.login).toHaveBeenCalledTimes(1)
    })
    test("it should return error 401, password does not match", async () => {
        const req = {
            body: {
                username: 'customer1',
                password: 'passwordError',
            }
        };
        jest.spyOn(Authenticator.prototype, "login").mockRejectedValueOnce(new Error("Incorrect username and/or password"))
        const response = await request(app).post(baseURL + "/").send(req.body)
        expect(response.status).toBe(401)
        expect(Authenticator.prototype.login).toHaveBeenCalledTimes(1)
    })
})


describe("Logout - DELETE ezelectronics/sessions/current", () => {
    test("Logout performed - 200", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  next())
        jest.spyOn(Authenticator.prototype, "logout").mockResolvedValueOnce(null)
        const response = await request(app).delete(baseURL + "/current").send()
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
        expect(response.status).toBe(200)
        expect(Authenticator.prototype.logout).toHaveBeenCalledTimes(1)
    })
    test("Logout error - 401, user not authenticated", async () => {
        jest.spyOn(Authenticator.prototype, "logout")
        const response = await request(app).delete(baseURL + "/current").send()
        expect(response.status).toBe(401)
        expect(Authenticator.prototype.logout).toHaveBeenCalledTimes(0)
    })
})

describe("Session - GET ezelectronics/sessions/current", () => {
    test("current session performed - 200", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  next())
        const response = await request(app).get(baseURL + "/current").send()
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
        expect(response.status).toBe(200)
    })
    test("current session error - 401, user not authenticated", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn")
        const response = await request(app).get(baseURL + "/current").send()
        expect(response.status).toBe(401)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
    })
})

