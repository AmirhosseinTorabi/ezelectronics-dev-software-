import { test, expect, jest, describe, beforeEach } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import { User, Role } from "../../src/components/user"
import { UserAlreadyExistsError, UserNotAdminError, UserNotFoundError, BirthdateIsAfterTodayError, UserIsAdminNotModifyError } from "../../src/errors/userError";


jest.mock("../../src/dao/userDAO")


let admin1 = new User("admin","admin","admin",Role.ADMIN,"","")
let customer1 = new User("customer","customer","customer",Role.CUSTOMER,"","")
let manager1 = new User("manager","manager","manager",Role.MANAGER,"","")
let admin2 = new User("admin","admin","admin",Role.ADMIN,"","")
let customer2 = new User("customer","customer","customer",Role.CUSTOMER,"","")
let manager2 = new User("manager","manager","manager",Role.MANAGER,"","")
let admin3 = new User("admin","admin","admin",Role.ADMIN,"","")
let customer3 = new User("customer","customer","customer",Role.CUSTOMER,"","")
let manager3 = new User("manager","manager","manager",Role.MANAGER,"","")
//Example of a unit test for the createUser method of the UserController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once with the correct parameters

beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks()
    //additional `mockClear()` must be placed here
});

describe("userController.createUser", () => {
    test("It should return true", async () => {
        const testUser = { //Define a test user object
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Manager"
        }
        jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
        const controller = new UserController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);
    
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
            testUser.name,
            testUser.surname,
            testUser.password,
            testUser.role);
        expect(response).toBe(true); //Check if the response is true
    });
    test("Error 409, user already registered", async () => {
        const testUser = { //Define a test user object
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Manager"
        }
        jest.spyOn(UserDAO.prototype, "createUser").mockRejectedValueOnce(new UserAlreadyExistsError()); //Mock the createUser method of the DAO
        const controller = new UserController();

        await expect(controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role)).rejects.toThrowError(new UserAlreadyExistsError());
        expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
            testUser.name,
            testUser.surname,
            testUser.password,
            testUser.role);
    });
    test("Error 50X, database error", async () => {
        const testUser = { //Define a test user object
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Manager"
        }
        const err = new Error('Database error');
        jest.spyOn(UserDAO.prototype, "createUser").mockRejectedValueOnce(err); //Mock the createUser method of the DAO
        const controller = new UserController();

        await expect(controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role)).rejects.toThrowError(err);
        expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
            testUser.name,
            testUser.surname,
            testUser.password,
            testUser.role);
    });
})

 describe("userController.getUsers", () =>{
     test("It should return all the users - 3", async ()=> {
         jest.spyOn(UserDAO.prototype, "getAllUsers").mockResolvedValue([admin1,customer1,manager1])
         const controller = new UserController();
         const result = await controller.getUsers();
         expect(UserDAO.prototype.getAllUsers).toHaveBeenCalledTimes(1);
         expect(result).toHaveLength(3);
         expect(result).toEqual([admin1,customer1,manager1]);
     });
     test("It should return an empty array", async ()=> {
        jest.spyOn(UserDAO.prototype, "getAllUsers").mockResolvedValue([])
        const controller = new UserController();
        const result = await controller.getUsers();
        expect(UserDAO.prototype.getAllUsers).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(0);
        expect(result).toEqual([]);
    });
 })

 describe("userController.getUsersByRole", () =>{
    test("It should return 3 manager", async ()=> {
        jest.spyOn(UserDAO.prototype, "getUserByRole").mockResolvedValue([manager1,manager2,manager3])
        const role = Role.MANAGER;
        const controller = new UserController();
        const result = await controller.getUsersByRole(role);
        expect(UserDAO.prototype.getUserByRole).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.getUserByRole).toHaveBeenCalledWith(role);
        expect(result).toHaveLength(3);
        expect(result).toEqual([manager1,manager2,manager3]);
    });
    test("It should return 2 customer", async ()=> {
        jest.spyOn(UserDAO.prototype, "getUserByRole").mockResolvedValue([customer1,customer2])
        const role = Role.CUSTOMER;
        const controller = new UserController();
        const result = await controller.getUsersByRole(role);
        expect(UserDAO.prototype.getUserByRole).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.getUserByRole).toHaveBeenCalledWith(role);
        expect(result).toHaveLength(2);
        expect(result).toEqual([customer1,customer2]);
    });
    test("It should return 3 admin", async ()=> {
        jest.spyOn(UserDAO.prototype, "getUserByRole").mockResolvedValue([admin1,admin2,admin3])
        const role = Role.ADMIN;
        const controller = new UserController();
        const result = await controller.getUsersByRole(role);
        expect(UserDAO.prototype.getUserByRole).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.getUserByRole).toHaveBeenCalledWith(role);
        expect(result).toHaveLength(3);
        expect(result).toEqual([admin1,admin2,admin3]);
    });
    test("It should return 0 customer", async ()=> {
        jest.spyOn(UserDAO.prototype, "getUserByRole").mockResolvedValue([])
        const role = Role.CUSTOMER;
        const controller = new UserController();
        const result = await controller.getUsersByRole(role);
        expect(UserDAO.prototype.getUserByRole).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.getUserByRole).toHaveBeenCalledWith(role);
        expect(result).toHaveLength(0);
        expect(result).toEqual([]);
    });
    test("It should return 0 manager", async ()=> {
        jest.spyOn(UserDAO.prototype, "getUserByRole").mockResolvedValue([])
        const role = Role.MANAGER;
        const controller = new UserController();
        const result = await controller.getUsersByRole(role);
        expect(UserDAO.prototype.getUserByRole).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.getUserByRole).toHaveBeenCalledWith(role);
        expect(result).toHaveLength(0);
        expect(result).toEqual([]);
    });
})

describe("userController.getUserByUsername", () => {
    test("It should found 1 user - Customer searching itself", async ()=> {
        const mokedUser = new User("username1","name1","surname1",Role.CUSTOMER,"","")
        const calledUser = new User("username1","name1","surname1",Role.CUSTOMER,"","")
        const mokedUsername = "username1"
        jest.spyOn(UserDAO.prototype, "getUserByCustomUsername").mockResolvedValueOnce(mokedUser)
        const controller = new UserController();
        const result = await controller.getUserByUsername(calledUser,mokedUsername);
        expect(UserDAO.prototype.getUserByCustomUsername).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.getUserByCustomUsername).toHaveBeenCalledWith(calledUser,mokedUsername);
        expect(result).toEqual(mokedUser)
    });
    test("It should throw an error - Customer searching another user", async ()=> { 
        const calledUser = new User("username1","name1","surname1",Role.CUSTOMER,"","")
        const mokedUsername = "username2"
        jest.spyOn(UserDAO.prototype, "getUserByCustomUsername").mockRejectedValueOnce(new UserNotAdminError())
        const controller = new UserController();
        await expect(controller.getUserByUsername(calledUser,mokedUsername)).rejects.toThrow(new UserNotAdminError());
        expect(UserDAO.prototype.getUserByCustomUsername).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.getUserByCustomUsername).toHaveBeenCalledWith(calledUser,mokedUsername);
        
    });
    test("It should found 1 user - Admin searching a different user", async ()=> {
        const mokedUser = new User("modekUser","name1","surname1",Role.CUSTOMER,"","")
        const calledUser = new User("calledUser","name1","surname1",Role.ADMIN,"","")
        const mockedUsername = "modekUser"
        jest.spyOn(UserDAO.prototype, "getUserByCustomUsername").mockResolvedValueOnce(mokedUser)
        const controller = new UserController();
        const result = await controller.getUserByUsername(calledUser,mockedUsername);
        expect(UserDAO.prototype.getUserByCustomUsername).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.getUserByCustomUsername).toHaveBeenCalledWith(calledUser,mockedUsername);
        expect(result).toEqual(mokedUser)
    });
    test("It should throw an error - Username not found", async ()=> {
        const calledUser = new User("calledUser","name1","surname1",Role.ADMIN,"","")
        const mockedUsername = "non_existent_username"
        jest.spyOn(UserDAO.prototype, "getUserByCustomUsername").mockRejectedValueOnce(new UserNotFoundError())
        const controller = new UserController();
        await expect(controller.getUserByUsername(calledUser,mockedUsername)).rejects.toThrow(new UserNotFoundError());
        expect(UserDAO.prototype.getUserByCustomUsername).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.getUserByCustomUsername).toHaveBeenCalledWith(calledUser,mockedUsername);
        
    });
})

describe("userController.deleteUser", ()=>{
    test("It should return true - User deletes itself", async ()=> {
        const calledUser = new User("customer1","name1","surname1",Role.CUSTOMER,"","")
        const mockedUsername = "customer1"
        jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true)
        const controller = new UserController();
        const result = await controller.deleteUser(calledUser,mockedUsername);
        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith(calledUser,mockedUsername);
        expect(result).toBe(true)
    });
    test("It should throw an error - Admin tries to delete a non-existet user", async ()=> {
        const calledUser = new User("calledUser","name1","surname1",Role.ADMIN,"","")
        const mockedUsername = "non_existent_username"
        jest.spyOn(UserDAO.prototype, "deleteUser").mockRejectedValueOnce(new UserNotFoundError())
        const controller = new UserController();
        await expect(controller.deleteUser(calledUser,mockedUsername)).rejects.toThrow(new UserNotFoundError())
        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith(calledUser,mockedUsername);
    });
    test("It should throw an error - Admin tries to delete another admin", async ()=> {
        const calledUser = new User("admin1","name1","surname1",Role.ADMIN,"","")
        const mockedUsername = "admin2"
        jest.spyOn(UserDAO.prototype, "deleteUser").mockRejectedValueOnce(new UserIsAdminNotModifyError())
        const controller = new UserController();
        await expect(controller.deleteUser(calledUser,mockedUsername)).rejects.toThrow(new UserIsAdminNotModifyError())
        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith(calledUser,mockedUsername);
    });
    test("It should throw an error - Non Admin tries to delete another user", async ()=> {
        const calledUser = new User("customer1","name1","surname1",Role.CUSTOMER,"","")
        const mockedUsername = "customer2"
        jest.spyOn(UserDAO.prototype, "deleteUser").mockRejectedValueOnce(new UserNotAdminError())
        const controller = new UserController();
        await expect(controller.deleteUser(calledUser,mockedUsername)).rejects.toThrow(new UserNotAdminError())
        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith(calledUser,mockedUsername);
    });
})

describe("userController.deleteAll", () => {
    test("It should return true - every non Admin user is deleted", async () => {
        jest.spyOn(UserDAO.prototype, "deleteAllUsers").mockResolvedValueOnce(true);
        const controller = new UserController();
        const result = await controller.deleteAll();
        expect(UserDAO.prototype.deleteAllUsers).toHaveBeenCalledTimes(1);
        expect(result).toBe(true)
    })
})

describe("userController.updateUserInfo", () => {
    test("It should return an user - User updates its info", async () => {
        const calledUser = new User("calledUser","name1","surname1",Role.MANAGER,"","")
        const mockedUsername = "modekUser"
        const mockedName = "test"
        const mockedSurname = "test"
        const mockedAddress = "test"
        const mockedBirthdate = "YYYY-MM-DD"
        const mokedUser = new User(mockedUsername,mockedName,mockedSurname,Role.MANAGER,mockedAddress,mockedBirthdate)
        jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValueOnce(mokedUser)
        const controller = new UserController();
        const result = await controller.updateUserInfo(calledUser,mockedName,mockedSurname,mockedAddress,mockedBirthdate,mockedUsername);
        expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledWith(calledUser,mockedName,mockedSurname,mockedAddress,mockedBirthdate,mockedUsername);
        expect(result).toEqual(mokedUser)
    })
    test("It should return an user - Admin updates other non admin information", async () => {
        const calledUser = new User("calledUser","name1","surname1",Role.ADMIN,"","")
        const mockedUsername = "modekUser"
        const mockedName = "test"
        const mockedSurname = "test"
        const mockedAddress = "test"
        const mockedBirthdate = "YYYY-MM-DD"
        const mokedUser = new User(mockedUsername,mockedName,mockedSurname,Role.CUSTOMER,mockedAddress,mockedBirthdate)
        jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValueOnce(mokedUser)
        const controller = new UserController();
        const result = await controller.updateUserInfo(calledUser,mockedName,mockedSurname,mockedAddress,mockedBirthdate,mockedUsername);
        expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledWith(calledUser,mockedName,mockedSurname,mockedAddress,mockedBirthdate,mockedUsername);
        expect(result).toEqual(mokedUser)
    })
    test("It should return an error - User try to update non existent user", async () => {
        const calledUser = new User("calledUser","name1","surname1",Role.ADMIN,"","")
        const mockedUsername = "modekUser"
        const mockedName = "test"
        const mockedSurname = "test"
        const mockedAddress = "test"
        const mockedBirthdate = "YYYY-MM-DD"
        jest.spyOn(UserDAO.prototype, "updateUserInfo").mockRejectedValueOnce(new UserNotFoundError())
        const controller = new UserController();
        await expect(controller.updateUserInfo(calledUser,mockedName,mockedSurname,mockedAddress,mockedBirthdate,mockedUsername)).rejects.toThrow(new UserNotFoundError())
        expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledWith(calledUser,mockedName,mockedSurname,mockedAddress,mockedBirthdate,mockedUsername);
    })
    test("It should return an error - User try to update another existent user", async () => {
        const calledUser = new User("calledUser","name1","surname1",Role.ADMIN,"","")
        const mockedUsername = "modekUser"
        const mockedName = "test"
        const mockedSurname = "test"
        const mockedAddress = "test"
        const mockedBirthdate = "YYYY-MM-DD"
        jest.spyOn(UserDAO.prototype, "updateUserInfo").mockRejectedValueOnce(new UserNotAdminError())
        const controller = new UserController();
        await expect(controller.updateUserInfo(calledUser,mockedName,mockedSurname,mockedAddress,mockedBirthdate,mockedUsername)).rejects.toThrow(new UserNotAdminError())
        expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledWith(calledUser,mockedName,mockedSurname,mockedAddress,mockedBirthdate,mockedUsername);
    })
    test("It should return an error - User try to update its own info but the birthdate is after the current day", async () => {
        const calledUser = new User("calledUser","name1","surname1",Role.ADMIN,"","")
        const mockedUsername = "modekUser"
        const mockedName = "test"
        const mockedSurname = "test"
        const mockedAddress = "test"
        const mockedBirthdate = "3000-01-01"
        jest.spyOn(UserDAO.prototype, "updateUserInfo").mockRejectedValueOnce(new BirthdateIsAfterTodayError())
        const controller = new UserController();
        await expect(controller.updateUserInfo(calledUser,mockedName,mockedSurname,mockedAddress,mockedBirthdate,mockedUsername)).rejects.toThrow(new BirthdateIsAfterTodayError())
        expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledWith(calledUser,mockedName,mockedSurname,mockedAddress,mockedBirthdate,mockedUsername);
    })
})