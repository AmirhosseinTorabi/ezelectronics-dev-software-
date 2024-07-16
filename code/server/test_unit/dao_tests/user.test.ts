import { test, expect, jest, describe, beforeEach, beforeAll, afterAll } from "@jest/globals";
import UserController from "../../src/controllers/userController";
import UserDAO from "../../src/dao/userDAO";
import crypto from "crypto";
import db from "../../src/db/db";
import {  Database } from "sqlite3";
import express from "express"
import { User, Role } from "../../src/components/user";
import {
  UserAlreadyExistsError,
  UserNotAdminError,
  UserNotFoundError,
  BirthdateIsAfterTodayError,
  UserIsAdminNotModifyError,
} from "../../src/errors/userError";
import Authenticator from "../../src/routers/auth"
const passport = require('passport');
jest.mock("crypto");
jest.mock("../../src/db/db.ts");

//Example of unit test for the createUser method
//It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
//It then calls the createUser method and expects it to resolve true



let admin1 = new User("admin1", "admin", "admin", Role.ADMIN, "", "");
let customer1 = new User(
  "customer1",
  "customer",
  "customer",
  Role.CUSTOMER,
  "",
  ""
);
let manager1 = new User("manager1", "manager", "manager", Role.MANAGER, "", "");
let admin2 = new User("admin2", "admin", "admin", Role.ADMIN, "", "");
let customer2 = new User(
  "customer2",
  "customer",
  "customer",
  Role.CUSTOMER,
  "",
  ""
);
let manager2 = new User("manager2", "manager", "manager", Role.MANAGER, "", "");
let admin3 = new User("admin3", "admin", "admin", Role.ADMIN, "", "");
let customer3 = new User(
  "customer3",
  "customer",
  "customer",
  Role.CUSTOMER,
  "",
  ""
);
let manager3 = new User("manager3", "manager", "manager", Role.MANAGER, "", "");

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  //additional `mockClear()` must be placed here
});

describe("userDAO.createUser", () => {
  test("It should resolve true", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });
    const mockRandomBytes = jest
      .spyOn(crypto, "randomBytes")
      .mockImplementation((size) => {
        return Buffer.from("salt");
      });
    const mockScrypt = jest
      .spyOn(crypto, "scrypt")
      .mockImplementation(async (password, salt, keylen) => {
        return Buffer.from("hashedPassword");
      });
    const result = await userDAO.createUser(
      "username",
      "name",
      "surname",
      "password",
      "role"
    );
    expect(result).toBe(true);
    mockRandomBytes.mockRestore();
    mockDBRun.mockRestore();
    mockScrypt.mockRestore();
  });
  test("User already registered", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) => {
        callback(new Error("UNIQUE constraint failed: users.username"));
        return {} as Database;
      });
    const mockRandomBytes = jest
      .spyOn(crypto, "randomBytes")
      .mockImplementation((size) => {
        return Buffer.from("salt");
      });
    const mockScrypt = jest
      .spyOn(crypto, "scrypt")
      .mockImplementation(async (password, salt, keylen) => {
        return Buffer.from("hashedPassword");
      });
    await expect(
      userDAO.createUser("username", "name", "surname", "password", "role")
    ).rejects.toThrow(new UserAlreadyExistsError());
    mockRandomBytes.mockRestore();
    mockDBRun.mockRestore();
    mockScrypt.mockRestore();
  });
});

describe("userDAO.getAllUsers", () => {
  test("It should return all the users - 3", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest
      .spyOn(db, "all")
      .mockImplementation((sql, params, callback) => {
        callback(null, [admin1, customer1, manager1]);
        return {} as Database;
      });
    const result = await userDAO.getAllUsers();
    expect(result).toEqual([admin1, customer1, manager1]);
    expect(result).toHaveLength(3);
    expect(db.all).toHaveBeenCalledTimes(1);
    mockDBRun.mockRestore();
  });
  test("It should return an empty array", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest
      .spyOn(db, "all")
      .mockImplementation((sql, params, callback) => {
        callback(null, []);
        return {} as Database;
      });
    const result = await userDAO.getAllUsers();
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
    expect(db.all).toHaveBeenCalledTimes(1);
    mockDBRun.mockRestore();
  });
});

describe("userDAO.getUserByRole", () => {
  test("It should return 3 manager", async () => {
    const userDAO = new UserDAO();
    const role = Role.MANAGER;
    const mockDBRun = jest
      .spyOn(db, "all")
      .mockImplementation((sql, params, callback) => {
        callback(null, [manager1, manager2, manager3]);
        return {} as Database;
      });
    const result = await userDAO.getUserByRole(role);
    expect(result).toEqual([manager1, manager2, manager3]);
    expect(result).toHaveLength(3);
    expect(db.all).toHaveBeenCalledTimes(1);
    expect(db.all).toHaveBeenCalledWith(
      expect.any(String),
      [role],
      expect.any(Function)
    );
    mockDBRun.mockRestore();
  });
  test("It should return 2 customer", async () => {
    const userDAO = new UserDAO();
    const role = Role.CUSTOMER;
    const mockDBRun = jest
      .spyOn(db, "all")
      .mockImplementation((sql, params, callback) => {
        callback(null, [customer1, customer2]);
        return {} as Database;
      });
    const result = await userDAO.getUserByRole(role);
    expect(result).toEqual([customer1, customer2]);
    expect(result).toHaveLength(2);
    expect(db.all).toHaveBeenCalledTimes(1);
    expect(db.all).toHaveBeenCalledWith(
      expect.any(String),
      [role],
      expect.any(Function)
    );
    mockDBRun.mockRestore();
  });
  test("It should return 3 admin", async () => {
    const userDAO = new UserDAO();
    const role = Role.ADMIN;
    const mockDBRun = jest
      .spyOn(db, "all")
      .mockImplementation((sql, params, callback) => {
        callback(null, [admin1, admin2, admin3]);
        return {} as Database;
      });
    const result = await userDAO.getUserByRole(role);
    expect(result).toEqual([admin1, admin2, admin3]);
    expect(result).toHaveLength(3);
    expect(db.all).toHaveBeenCalledTimes(1);
    expect(db.all).toHaveBeenCalledWith(
      expect.any(String),
      [role],
      expect.any(Function)
    );
    mockDBRun.mockRestore();
  });
  test("It should return 0 customer", async () => {
    const userDAO = new UserDAO();
    const role = Role.CUSTOMER;
    const mockDBRun = jest
      .spyOn(db, "all")
      .mockImplementation((sql, params, callback) => {
        callback(null, []);
        return {} as Database;
      });
    const result = await userDAO.getUserByRole(role);
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
    expect(db.all).toHaveBeenCalledTimes(1);
    expect(db.all).toHaveBeenCalledWith(
      expect.any(String),
      [role],
      expect.any(Function)
    );
    mockDBRun.mockRestore();
  });
  test("It should return 0 manager", async () => {
    const userDAO = new UserDAO();
    const role = Role.MANAGER;
    const mockDBRun = jest
      .spyOn(db, "all")
      .mockImplementation((sql, params, callback) => {
        callback(null, []);
        return {} as Database;
      });
    const result = await userDAO.getUserByRole(role);
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
    expect(db.all).toHaveBeenCalledTimes(1);
    expect(db.all).toHaveBeenCalledWith(
      expect.any(String),
      [role],
      expect.any(Function)
    );
    mockDBRun.mockRestore();
  });
});

describe("userDAO.getUserByCustomUsername", () => {
  test("It should found 1 user - Customer searching itself", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) => {
        callback(null, customer1);
        return {} as Database;
      });
    const result = await userDAO.getUserByCustomUsername(
      customer1,
      "customer1"
    );
    expect(result).toEqual(customer1);
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(
      expect.any(String),
      ["customer1"],
      expect.any(Function)
    );
    mockDBRun.mockRestore();
  });
  test("It should throw an error - Customer searching another user", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest.spyOn(db, "get");
    await expect(
      userDAO.getUserByCustomUsername(customer1, "customer2")
    ).rejects.toThrow(new UserNotAdminError());
    expect(db.get).toHaveBeenCalledTimes(0);
    mockDBRun.mockRestore();
  });
  test("It should throw an error - Username not found", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) => {
        callback(null, undefined);
        return {} as Database;
      });
    await expect(
      userDAO.getUserByCustomUsername(admin1, "customer59")
    ).rejects.toThrow(new UserNotFoundError());
    expect(db.get).toHaveBeenCalledTimes(1);
    mockDBRun.mockRestore();
  });
  test("It should found 1 user - Admin searching a different user", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) => {
        callback(null, customer1);
        return {} as Database;
      });
    const result = await userDAO.getUserByCustomUsername(admin1, "customer1");
    expect(result).toEqual(customer1);
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(
      expect.any(String),
      ["customer1"],
      expect.any(Function)
    );
    mockDBRun.mockRestore();
  });
});

describe("userDAO.deleteUser", () => {
  test("It should return true - User deletes itself", async () => {
    const userDAO = new UserDAO();
    const mockDBRun_first = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) => {
        callback(null, customer1);
        return {} as Database;
      });
    const mockDBRun_second = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });
    const result = await userDAO.deleteUser(customer1, "customer1");
    expect(result).toBe(true);
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(
      expect.any(String),
      ["customer1"],
      expect.any(Function)
    );
    expect(db.run).toHaveBeenCalledTimes(1);
    expect(db.run).toHaveBeenCalledWith(
      expect.any(String),
      ["customer1"],
      expect.any(Function)
    );
    mockDBRun_first.mockRestore();
    mockDBRun_second.mockRestore();
  });
  test("It should return true - Admin deletes non-admin user", async () => {
    const userDAO = new UserDAO();
    const mockDBRun_first = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) => {
        callback(null, customer1);
        return {} as Database;
      });
    const mockDBRun_second = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });
    const result = await userDAO.deleteUser(admin1, "customer1");
    expect(result).toBe(true);
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(
      expect.any(String),
      ["customer1"],
      expect.any(Function)
    );
    expect(db.run).toHaveBeenCalledTimes(1);
    expect(db.run).toHaveBeenCalledWith(
      expect.any(String),
      ["customer1"],
      expect.any(Function)
    );
    mockDBRun_first.mockRestore();
    mockDBRun_second.mockRestore();
  });
  test("It should throw an error - Admin tries to delete a non-existet user", async () => {
    const userDAO = new UserDAO();
    const mockDBRun_first = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) => {
        callback(null, undefined);
        return {} as Database;
      });
    await expect(userDAO.deleteUser(admin1, "customer59")).rejects.toThrow(
      new UserNotFoundError()
    );
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(
      expect.any(String),
      ["customer59"],
      expect.any(Function)
    );
    mockDBRun_first.mockRestore();
  });
  test("It should throw an error - Admin tries to delete another admin", async () => {
    const userDAO = new UserDAO();
    const mockDBRun_first = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) => {
        callback(null, admin2);
        return {} as Database;
      });
    await expect(userDAO.deleteUser(admin1, "admin2")).rejects.toThrow(
      new UserIsAdminNotModifyError()
    );
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(
      expect.any(String),
      ["admin2"],
      expect.any(Function)
    );
    mockDBRun_first.mockRestore();
  });
  test("It should throw an error - Non Admin tries to delete another user", async () => {
    const userDAO = new UserDAO();
    const mockDBRun_first = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) => {
        callback(null, manager2);
        return {} as Database;
      });
    await expect(userDAO.deleteUser(manager1, "manager2")).rejects.toThrow(
      new UserIsAdminNotModifyError()
    );
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(
      expect.any(String),
      ["manager2"],
      expect.any(Function)
    );
    mockDBRun_first.mockRestore();
  });
});

describe("userDAO.deleteAllUsers", () => {
  test("It should return true - every non Admin user is deleted", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });
    const result = await userDAO.deleteAllUsers();
    expect(result).toBe(true);
    expect(db.run).toHaveBeenCalledTimes(1);
    expect(db.run).toHaveBeenCalledWith(
      expect.any(String),
      [],
      expect.any(Function)
    );
    mockDBRun.mockRestore();
  });
});

describe("userDAO.updateUserInfo", () => {
  test("It should return an user - User updates its info", async () => {
    const userDAO = new UserDAO();
    const mockedName = "test";
    const mockedSurname = "test";
    const mockedAddress = "test";
    const mockedBirthdate = "2000-01-01";
    const mockDBRun_first = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) => {
        callback(null, customer1);
        return {} as Database;
      });
    const mockDBRun_second = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });
    const result = await userDAO.updateUserInfo(
      customer1,
      mockedName,
      mockedSurname,
      mockedAddress,
      mockedBirthdate,
      "customer1"
    );
    expect(result).toEqual(
      new User(
        "customer1",
        mockedName,
        mockedSurname,
        Role.CUSTOMER,
        mockedAddress,
        mockedBirthdate
      )
    );
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(
      expect.any(String),
      ["customer1"],
      expect.any(Function)
    );
    expect(db.run).toHaveBeenCalledTimes(1);
    expect(db.run).toHaveBeenCalledWith(
      expect.any(String),
      [mockedName, mockedSurname, mockedAddress, mockedBirthdate, "customer1"],
      expect.any(Function)
    );
    mockDBRun_first.mockRestore();
    mockDBRun_second.mockRestore();
  });
  test("It should return an user - Admin updates other non admin information", async () => {
    const userDAO = new UserDAO();
    const mockedName = "test";
    const mockedSurname = "test";
    const mockedAddress = "test";
    const mockedBirthdate = "2000-01-01";
    const mockDBRun_first = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) => {
        callback(null, customer1);
        return {} as Database;
      });
    const mockDBRun_second = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });
    const result = await userDAO.updateUserInfo(
      admin1,
      mockedName,
      mockedSurname,
      mockedAddress,
      mockedBirthdate,
      "customer1"
    );
    expect(result).toEqual(
      new User(
        "customer1",
        mockedName,
        mockedSurname,
        Role.CUSTOMER,
        mockedAddress,
        mockedBirthdate
      )
    );
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(
      expect.any(String),
      ["customer1"],
      expect.any(Function)
    );
    expect(db.run).toHaveBeenCalledTimes(1);
    expect(db.run).toHaveBeenCalledWith(
      expect.any(String),
      [mockedName, mockedSurname, mockedAddress, mockedBirthdate, "customer1"],
      expect.any(Function)
    );
    mockDBRun_first.mockRestore();
    mockDBRun_second.mockRestore();
  });
  test("It should return an error - User try to update non existent user", async () => {
    const userDAO = new UserDAO();
    const mockedName = "test";
    const mockedSurname = "test";
    const mockedAddress = "test";
    const mockedBirthdate = "2000-01-01";
    const mockDBRun_first = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) => {
        callback(null, undefined);
        return {} as Database;
      });
    const mockDBRun_second = jest.spyOn(db, "run");
    await expect(
      userDAO.updateUserInfo(
        admin1,
        mockedName,
        mockedSurname,
        mockedAddress,
        mockedBirthdate,
        "customer59"
      )
    ).rejects.toThrow(new UserNotFoundError());
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(
      expect.any(String),
      ["customer59"],
      expect.any(Function)
    );
    expect(db.run).toHaveBeenCalledTimes(0);
    mockDBRun_first.mockRestore();
    mockDBRun_second.mockRestore();
  });
  test("It should return an error - User try to update another existent user", async () => {
    const userDAO = new UserDAO();
    const mockedName = "test";
    const mockedSurname = "test";
    const mockedAddress = "test";
    const mockedBirthdate = "2000-01-01";
    const mockDBRun_first = jest.spyOn(db, "get");
    const mockDBRun_second = jest.spyOn(db, "run");
    await expect(
      userDAO.updateUserInfo(
        customer1,
        mockedName,
        mockedSurname,
        mockedAddress,
        mockedBirthdate,
        "customer2"
      )
    ).rejects.toThrow(new UserNotAdminError());
    expect(db.get).toHaveBeenCalledTimes(0);
    expect(db.run).toHaveBeenCalledTimes(0);
    mockDBRun_first.mockRestore();
    mockDBRun_second.mockRestore();
  });
  test("It should return an error - User try to update its own info but the birthdate is after the current day", async () => {
    const userDAO = new UserDAO();
    const mockedName = "test";
    const mockedSurname = "test";
    const mockedAddress = "test";
    const mockedBirthdate = "4000-01-01";
    const mockDBRun_first = jest.spyOn(db, "get");
    const mockDBRun_second = jest.spyOn(db, "run");
    await expect(
      userDAO.updateUserInfo(
        customer1,
        mockedName,
        mockedSurname,
        mockedAddress,
        mockedBirthdate,
        "customer1"
      )
    ).rejects.toThrow(new BirthdateIsAfterTodayError());
    expect(db.get).toHaveBeenCalledTimes(0);
    expect(db.run).toHaveBeenCalledTimes(0);
    mockDBRun_first.mockRestore();
    mockDBRun_second.mockRestore();
  });
});

describe("userDAO.getIsUserAuthenticated", () => {
  test("It should return true - Auth succedded", async () => {
    const userDAO = new UserDAO();
    const mockedQueryResult = {
      username: "customer1",
      password: Buffer.from("hashedPassword").toString("hex"), // Ensure password is in hex string format
      salt: Buffer.from("salt").toString("hex"),
    };
    const mockDBRun = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) => {
        callback(null, mockedQueryResult);
        return {} as Database;
      });
    const mockScrypt = jest
      .spyOn(crypto, "timingSafeEqual")
      .mockImplementation((passwordHex, hashedPassword) => {
        return true;
      });
    const result = await userDAO.getIsUserAuthenticated(
      "customer1",
      "plainpassword"
    );
    expect(result).toBe(true);
    mockDBRun.mockRestore();
    mockScrypt.mockRestore();
  });
  test("It should return false - Auth failed, no matching password", async () => {
    const userDAO = new UserDAO();
    const mockedQueryResult = {
      username: "customer1",
      password: Buffer.from("hashedPassword").toString("hex"), // Ensure password is in hex string format
      salt: Buffer.from("salt").toString("hex"),
    };
    const mockDBRun = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) => {
        callback(null, mockedQueryResult);
        return {} as Database;
      });
    const mockScrypt = jest
      .spyOn(crypto, "timingSafeEqual")
      .mockImplementation((passwordHex, hashedPassword) => {
        return false;
      });
    const result = await userDAO.getIsUserAuthenticated(
      "customer1",
      "plainpassword"
    );
    expect(result).toBe(false);
    mockDBRun.mockRestore();
    mockScrypt.mockRestore();
  });
  test("It should return false - Auth failed, no matching username", async () => {
    const userDAO = new UserDAO();
    const mockedQueryResult = {
      username: "customer1",
      password: Buffer.from("hashedPassword").toString("hex"), // Ensure password is in hex string format
      salt: Buffer.from("salt").toString("hex"),
    };
    const mockDBRun = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) => {
        callback(null, undefined);
        return {} as Database;
      });
    const mockScrypt = jest
      .spyOn(crypto, "timingSafeEqual")
      .mockImplementation((passwordHex, hashedPassword) => {
        return false;
      });
    const result = await userDAO.getIsUserAuthenticated(
      "customer1",
      "plainpassword"
    );
    expect(result).toBe(false);
    mockDBRun.mockRestore();
    mockScrypt.mockRestore();
  });
});

describe("userDAO.SearchByUsername", () => {
  test("It should found 1 user ", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) => {
        callback(null, customer1);
        return {} as Database;
      });
    const result = await userDAO.getUserByUsername("customer1");
    expect(result).toEqual(customer1);
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(
      expect.any(String),
      ["customer1"],
      expect.any(Function)
    );
    mockDBRun.mockRestore();
  });
  test("It should throw an error - Username not found", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) => {
        callback(null, undefined);
        return {} as Database;
      });
    await expect(userDAO.getUserByUsername("customer59")).rejects.toThrow(
      new UserNotFoundError()
    );
    expect(db.get).toHaveBeenCalledTimes(1);
    mockDBRun.mockRestore();
  });
});

/* -------------------------------------------------------- AUTH.ts */

// describe('Authenticator login method', () => {
  

//   test('Successful authentication', async () => {
//     const app = express();
//     // Mock req, res, and next
//     const req = {
//       body: {
//         username: 'testuser', // Provide username
//         password: 'testpassword' // Provide password
//       }
//     };
//     const res = {};
//     const next = jest.fn();

//     // Create an instance of Authenticator
//     const auth = new Authenticator( app);

//     // Call the login method
//     const user = await auth.login(req, res, next);

//     // Check if the returned user object is correct
//     expect(user).toEqual({ username: 'testuser' });

//     // Check if passport.authenticate was called with correct parameters
//     expect(passport.authenticate).toHaveBeenCalledWith('local', expect.any(Function));
//   });
// });