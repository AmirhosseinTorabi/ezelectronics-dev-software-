import { test, expect, jest, describe, beforeEach} from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { User, Role } from "../../src/components/user"
import { UserAlreadyExistsError, UserNotAdminError, UserNotFoundError, BirthdateIsAfterTodayError, UserIsAdminNotModifyError } from "../../src/errors/userError";
import UserController from "../../src/controllers/userController"
import Authenticator from "../../src/routers/auth"
const baseURL = "/ezelectronics"

//Example of a unit test for the POST ezelectronics/users route
//The test checks if the route returns a 200 success code
//The test also expects the createUser method of the controller to be called once with the correct parameters

let admin1 = new User("admin1","admin","admin",Role.ADMIN,"","")
let customer1 = new User("customer1","customer","customer",Role.CUSTOMER,"","")
let manager1 = new User("manager1","manager","manager",Role.MANAGER,"","")
let admin2 = new User("admin2","admin","admin",Role.ADMIN,"","")
let customer2 = new User("customer2","customer","customer",Role.CUSTOMER,"","")
let manager2 = new User("manager2","manager","manager",Role.MANAGER,"","")
let admin3 = new User("admin3","admin","admin",Role.ADMIN,"","")
let customer3 = new User("customer3","customer","customer",Role.CUSTOMER,"","")
let manager3 = new User("manager3","manager","manager",Role.MANAGER,"","")

beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks()
    //additional `mockClear()` must be placed here
});


describe("POST ezelectronics/users", () => {
    test("It should return a 200 success code", async () => {
        const testUser = { //Define a test user object sent to the route
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Manager"
        }
        jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
        //Check if the createUser method has been called with the correct parameters
        expect(UserController.prototype.createUser).toHaveBeenCalledWith(testUser.username,
            testUser.name,
            testUser.surname,
            testUser.password,
            testUser.role)
    })
    test("It should return a 409 error code, user already exist", async () => {
        const testUser = { //Define a test user object sent to the route
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Manager"
        }
        jest.spyOn(UserController.prototype, "createUser").mockRejectedValueOnce(new UserAlreadyExistsError()) //Mock the createUser method of the controller
        const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
        expect(response.status).toBe(409)
        expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
        //Check if the createUser method has been called with the correct parameters
        expect(UserController.prototype.createUser).toHaveBeenCalledWith(testUser.username,
            testUser.name,
            testUser.surname,
            testUser.password,
            testUser.role)
    })
    test("It should return a 422 error code, wrong body content", async () => {
        const testUser = { //Define a test user object sent to the route
            username: "",
            name: "test",
            surname: "test",
            password: "test",
            role: "Manager"
        }
        jest.spyOn(UserController.prototype, "createUser")
        const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
        expect(response.status).toBe(422)
        expect(UserController.prototype.createUser).toHaveBeenCalledTimes(0) //Check if the createUser method has been called once
        //Check if the createUser method has been called with the correct parameters
        
    })
    test("It should return a 422 error code, wrong body content", async () => {
        const testUser = { //Define a test user object sent to the route
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Capra"
        }
        jest.spyOn(UserController.prototype, "createUser")
        const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
        expect(response.status).toBe(422)
        expect(UserController.prototype.createUser).toHaveBeenCalledTimes(0) //Check if the createUser method has been called once
        //Check if the createUser method has been called with the correct parameters
        
    })
    test("It should return a 422 error code, wrong body content", async () => {
        const testUser = { //Define a test user object sent to the route
            username: "test",
            name: "test",   // 1 parameter missing
            surname: "test",
            role: "Capra"
        }
        jest.spyOn(UserController.prototype, "createUser")
        const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
        expect(response.status).toBe(422)
        expect(UserController.prototype.createUser).toHaveBeenCalledTimes(0) //Check if the createUser method has been called once
        //Check if the createUser method has been called with the correct parameters
        
    })
    test("It should return a 422 error code, wrong body content", async () => {
        const testUser = { //Define a test user object sent to the route
            username: "test",
            name: "test",   // 1 parameter missing
            surname: "test",
            password: "test",
            role: "Capra"
        }
        jest.spyOn(UserController.prototype, "createUser")
        const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
        expect(response.status).toBe(422)
        expect(UserController.prototype.createUser).toHaveBeenCalledTimes(0) //Check if the createUser method has been called once
        //Check if the createUser method has been called with the correct parameters
        
    })
})

describe("GET ezelectronics/users", () =>{
    test("It should return all the users - 3", async ()=> {
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementationOnce((req,res,next) =>  next())
        jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce([manager1,admin1,customer1])
        const response = await request(app).get(baseURL + "/users").send() //Send a POST request to the route
        expect(response.status).toBe(200)
        expect(Authenticator.prototype.isAdmin).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(1) 
    });
    test("It should fail 401, not admin", async ()=> {
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementationOnce((req,res,next) =>  res.status(401).json({ error: "Unauthorized" }))
        jest.spyOn(UserController.prototype, "getUsers")
        const response = await request(app).get(baseURL + "/users").send() //Send a POST request to the route
        expect(response.status).toBe(401)
        expect(Authenticator.prototype.isAdmin).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(0) 
    });
})

describe("GET ezelectronics/users/roles/:role", () =>{
    test("It should return 3 manager", async ()=> {
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementationOnce((req,res,next) =>  next())
        jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce([manager1,manager2,manager3])
        const response = await request(app).get(baseURL + "/users/roles/Admin").send() //Send a POST request to the route
        expect(response.status).toBe(200)
        expect(response.body).toEqual([manager1,manager2,manager3])
        expect(Authenticator.prototype.isAdmin).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(1) 
    });
    test("It should return 0 customer", async ()=> {
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementationOnce((req,res,next) =>  next())
        jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce([])
        const response = await request(app).get(baseURL + "/users/roles/Customer").send() //Send a POST request to the route
        expect(response.status).toBe(200)
        expect(response.body).toEqual([])
        expect(Authenticator.prototype.isAdmin).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(1) 
    });
    test("It should return 422 error, wrong paramter", async ()=> {
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementationOnce((req,res,next) =>  next())
        jest.spyOn(UserController.prototype, "getUsersByRole")
        const response = await request(app).get(baseURL + "/users/roles/Prova").send() //Send a POST request to the route
        expect(response.status).toBe(422)
        expect(Authenticator.prototype.isAdmin).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(0) 
    });
    test("It should return 401 error, not admin", async ()=> {
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementationOnce((req,res,next) =>  res.status(401).json({ error: "Unauthorized" }))
        jest.spyOn(UserController.prototype, "getUsersByRole")
        const response = await request(app).get(baseURL + "/users/roles/Admin").send() //Send a POST request to the route
        expect(response.status).toBe(401)
        expect(Authenticator.prototype.isAdmin).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(0) 
    });
})

describe("GET ezelectronics/users/:username", () => {
    test("It should found 1 user - Customer searching itself", async ()=> {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  next())
        jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(customer1)
        const response = await request(app).get(baseURL + "/users/customer1").send() //Send a POST request to the route
        expect(response.status).toBe(200)
        expect(response.body).toEqual(customer1)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1) 
    });
    test("It should throw an error 401 - Customer searching another user", async ()=> { 
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(UserController.prototype, "getUserByUsername").mockRejectedValueOnce(new UserNotAdminError())
        const response = await request(app).get(baseURL + "/users/customer2").send() //Send a POST request to the route
        expect(response.status).toBe(401)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.getUserByUsername).toHaveBeenCalledWith(customer1, "customer2");
    });
    test("It should throw an error 404 - Username not found", async ()=> {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(UserController.prototype, "getUserByUsername").mockRejectedValueOnce(new UserNotFoundError())
        const response = await request(app).get(baseURL + "/users/customer9000").send() //Send a POST request to the route
        expect(response.status).toBe(404)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.getUserByUsername).toHaveBeenCalledWith(admin1, "customer9000");
    });
})

describe("DELETE ezelectronics/users/:username", ()=>{
    test("It should return true - User deletes itself", async ()=> {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true)
        const response = await request(app).delete(baseURL + "/users/customer1").send() //Send a POST request to the route
        expect(response.status).toBe(200)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.deleteUser).toHaveBeenCalledWith(customer1, "customer1");
    });
    test("It should throw an error 404 - Admin tries to delete a non-existet user", async ()=> {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValueOnce(new UserNotFoundError())
        const response = await request(app).delete(baseURL + "/users/customer9000").send() //Send a POST request to the route
        expect(response.status).toBe(404)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.deleteUser).toHaveBeenCalledWith(admin1, "customer9000");
    });
    test("It should throw an error 401 - Admin tries to delete another admin", async ()=> {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValueOnce(new UserIsAdminNotModifyError())
        const response = await request(app).delete(baseURL + "/users/admin2").send() //Send a POST request to the route
        expect(response.status).toBe(401)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.deleteUser).toHaveBeenCalledWith(admin1, "admin2");
    });
    test("It should throw an error 401 - Non Admin tries to delete another user", async ()=> {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValueOnce(new UserNotAdminError())
        const response = await request(app).delete(baseURL + "/users/customer2").send() //Send a POST request to the route
        expect(response.status).toBe(401)
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.deleteUser).toHaveBeenCalledWith(customer1, "customer2");
    });
})

describe("DELETE ezelectronics/users", () => {
    test("It should return true - every non Admin user is deleted", async () => {
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValue(true)
        const response = await request(app).delete(baseURL + "/users/").send() //Send a POST request to the route
        expect(Authenticator.prototype.isAdmin).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.deleteAll).toHaveBeenCalledTimes(1) 
        expect(response.status).toBe(200)
    })
})

describe("PATCH ezelectronics/users/:username", () => {
    test("It should return an user - User updates its info", async () => {
        const testUser = { //Define a test user object sent to the route
            name: "test",
            surname: "test",
            address: "test",
            birthdate: "2000-01-01"
        }
        const mockedUser = new User("customer1",testUser.name,testUser.surname,Role.CUSTOMER,testUser.address,testUser.birthdate)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValue(mockedUser)
        const response = await request(app).patch(baseURL + "/users/customer1").send(testUser) //Send a POST request to the route
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.updateUserInfo).toHaveBeenCalledWith(customer1,testUser.name,testUser.surname,testUser.address,testUser.birthdate,"customer1")
        expect(response.status).toBe(200)
    })
    test("It should return an user - Admin updates other non admin information", async () => {
        const testUser = { //Define a test user object sent to the route
            name: "test",
            surname: "test",
            address: "test",
            birthdate: "2000-01-01"
        }
        const mockedUser = new User("customer1",testUser.name,testUser.surname,Role.CUSTOMER,testUser.address,testUser.birthdate)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValue(mockedUser)
        const response = await request(app).patch(baseURL + "/users/customer1").send(testUser) //Send a POST request to the route
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.updateUserInfo).toHaveBeenCalledWith(admin1,testUser.name,testUser.surname,testUser.address,testUser.birthdate,"customer1")
        expect(response.status).toBe(200)
    })
    test("It should return an error 401 - User try to update non existent user", async () => {
        const testUser = { //Define a test user object sent to the route
            name: "test",
            surname: "test",
            address: "test",
            birthdate: "2000-01-01"
        }
        const mockedUser = new User("customer1",testUser.name,testUser.surname,Role.CUSTOMER,testUser.address,testUser.birthdate)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = admin1;
            return next()})
        jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValueOnce(new UserNotFoundError)
        const response = await request(app).patch(baseURL + "/users/customer9999").send(testUser) //Send a POST request to the route
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.updateUserInfo).toHaveBeenCalledWith(admin1,testUser.name,testUser.surname,testUser.address,testUser.birthdate,"customer9999")
        expect(response.status).toBe(404)
    })
    test("It should return an error - User try to update another existent user", async () => {
        const testUser = { //Define a test user object sent to the route
            name: "test",
            surname: "test",
            address: "test",
            birthdate: "2000-01-01"
        }
        const mockedUser = new User("customer1",testUser.name,testUser.surname,Role.CUSTOMER,testUser.address,testUser.birthdate)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValueOnce(new UserNotAdminError())
        const response = await request(app).patch(baseURL + "/users/customer2").send(testUser) //Send a POST request to the route
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.updateUserInfo).toHaveBeenCalledWith(customer1,testUser.name,testUser.surname,testUser.address,testUser.birthdate,"customer2")
        expect(response.status).toBe(401)
    })
    test("It should return an error - User try to update its own info but the birthdate is after the current day", async () => {
        const testUser = { //Define a test user object sent to the route
            name: "test",
            surname: "test",
            address: "test",
            birthdate: "3000-01-01"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValueOnce(new BirthdateIsAfterTodayError())
        const response = await request(app).patch(baseURL + "/users/customer1").send(testUser) //Send a POST request to the route
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.updateUserInfo).toHaveBeenCalledWith(customer1,testUser.name,testUser.surname,testUser.address,testUser.birthdate,"customer1")
        expect(response.status).toBe(400)
    })
    test("It should return an error 422 - Wrong body content 1", async () => {
        const testUser = { //Define a test user object sent to the route
            name: "test",
            surname: "",
            address: "test",
            birthdate: "3000-01-01"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(UserController.prototype, "updateUserInfo")
        const response = await request(app).patch(baseURL + "/users/customer1").send(testUser) //Send a POST request to the route
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(0) 
        expect(response.status).toBe(422)
    })
    test("It should return an error 422 - Wrong body content 2", async () => {
        const testUser = { //Define a test user object sent to the route
            name: "test",
            
            address: "test",
            birthdate: "3000-01-01"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(UserController.prototype, "updateUserInfo")
        const response = await request(app).patch(baseURL + "/users/customer1").send(testUser) //Send a POST request to the route
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(0) 
        expect(response.status).toBe(422)
    })
    test("It should return an error 422 - Wrong body content 3", async () => {
        const testUser = { //Define a test user object sent to the route
            name: "test",
            surname: "test",
            address: "test",
            birthdate: "invalid"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req,res,next) =>  {
            req.user = customer1;
            return next()})
        jest.spyOn(UserController.prototype, "updateUserInfo")
        const response = await request(app).patch(baseURL + "/users/customer1").send(testUser) //Send a POST request to the route
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1) 
        expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(0) 
        expect(response.status).toBe(422)
    })
})