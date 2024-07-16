 import ProductDao from "../../src/dao/productDAO";
 import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals"
 import db from "../../src/db/db";
 import { Category, Product } from "../../src/components/product";
import CartDAO from "../../src/dao/cartDAO";
import { fail } from "assert";
import { ChangeDateError, ProductNotFoundError, SellingDateError, WrongParameterError,LowProductStockError, ProductSoldError } from "../../src/errors/productError";
import { Database } from "sqlite3";

 jest.mock("crypto");
 jest.mock("../../src/db/db.ts");

 let productDao: ProductDao;

 beforeEach(() => {
    productDao = new ProductDao();
    jest.clearAllMocks();
  jest.restoreAllMocks()
  });

  afterEach(() => {
  jest.restoreAllMocks();
  });

 const newProduct1 = new Product(
   "Product Name 1",
   Category.LAPTOP,
   7,
   "Description-Test-1",
   3200,
   "05/03/2024"
 );

 const newProduct2 = new Product(
   "Product Name 2",
   Category.SMARTPHONE,
   7,
   "Description-Test-2",
   3200,
   "01/09/2021"
 );

 //arrivalDate > today
 const newProductArrivalDateGtTodat = new Product(
  "Product Name 3",
  Category.SMARTPHONE,
  7,
  "Description-Test-3",
  3200,
  new Date(new Date().getTime() + 5*60*60*24*1000).toISOString().substring(0, 10)
);

function mockRunOnce(accessoryData: string | null){
  return jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
    callback(null)
    return {} as Database
  });
}

function mockGetOnce(queryResult: any | null, accessoryData: string | null){
  return jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
    callback(accessoryData, queryResult)
    return {} as Database
  });
}

function mockAllOnce(queryResult: any[] | null, accessoryData: string | null){
  return jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
    callback(accessoryData, queryResult)
    return {} as Database
  });
}


 /**
  * registerProducts:
  * 1. arrival > today
  * 2. Insert done
  */
 describe("productDAO.Register Product tests", () => {

   test("arrivalDate > today -> SellingDateError", async () => {
     try{
      await productDao.registerProducts("Product Name 3", Category.SMARTPHONE, 7, "Description-Test-3", 3200, new Date(new Date().getTime() + 5*60*60*24*1000).toISOString().substring(0, 10))
      fail("it should break!")
    } catch(err){
      expect(err instanceof SellingDateError).toBe(true);
     }
   });

   test("arrivalDate < today -> insertDone", async () => {
      const mockDb = mockRunOnce(null) 
      let result = await productDao.registerProducts("Product Name 2", Category.SMARTPHONE, 7, "Description-Test-2", 3200, "01/09/2021");
      expect(result).toBe(true)
   });
 });


 /**
  * changeProductQuantity:
  * 1. first get: ProductNotFoundError
  * 2. changeDate == null but arrivalDateDt>changeDateDt=sysdate -> ChangeDateError
  * 3. changeDate defined and arrivalDateDt>changeDateDt -> ChangeDateError
  * 4. changeDate==null and arrivalDate<changeDateDt=sysdate -> enter UPDATE -> resolve
  */
 describe("productDAO.changeProductQuantity", () => {

  test("first get: ProductNotFoundError", async () => {
    const mockDBGet = mockGetOnce(null, null)
    try{
     await productDao.changeProductQuantity("Product Name 3", 7, '2024-06-01')
     fail("it should break!")
   } catch(err){
     expect(err instanceof ProductNotFoundError).toBe(true);
    }
  });

  //new Date(new Date().getTime() + 5*60*60*24*1000).toISOString().substring(0, 10)

  test("first get: changeDate == today but arrivalDateDt>changeDateDt=sysdate -> ChangeDateError", async () => {
    const mockDBGet = mockGetOnce({arrivalDate : new Date(new Date().getTime() + 5*60*60*24*1000).toISOString().substring(0, 10)}, null)
    try{
     await productDao.changeProductQuantity("Product Name 3", 7, new Date().toISOString().split('T')[0])
     fail("it should break!")
   } catch(err){
     expect(err instanceof ChangeDateError).toBe(true);
    }
  });

  test("first get: changeDate is defined but > sysdate", async () => {
    const mockDBGet = mockGetOnce({arrivalDate : new Date(new Date().getTime() + 5*60*60*24*1000).toISOString().substring(0, 10)}, null)
    try{
     await productDao.changeProductQuantity("Product Name 3", 7, new Date(new Date().getTime() + 5*60*60*24*1000).toISOString().substring(0, 10))
     fail("it should break!")
   } catch(err){
     expect(err instanceof ChangeDateError).toBe(true);
    }
  });

  
  test("changeDate==today and arrivalDate<changeDateDt=sysdate -> enter UPDATE -> resolve true", async () => {
    const mockDBGet = mockGetOnce({quantity: 3, arrivalDate : new Date(new Date().getTime() - 5*60*60*24*1000).toISOString().substring(0, 10)}, null)
    const mockDBRun = mockRunOnce(null) 
    const result = await productDao.changeProductQuantity("Product Name 3", 7, new Date().toISOString().split('T')[0])
     expect(result).toBe(10);
  });
});

/**
 * getAvailableProducts:
 * 1. case grouping == null and category!=null or model!=null -> WrongParameterError
 * 2. case grouping =="category" and category==null or model!=null-> WrongParameterError
 * 3. case grouping=="model" and model==null or category!=null-> WrongParameterError
 * 4. enter select -> rows empty -> ProductNotFoundError
 * 5. enter select and grouping=model but model not available -> return []
 * 6. enter select and it works (it makes no sense to try all cases in unit tests)
 */

describe("productDAO.getAvailableProduct", () => {

  test("case grouping == null and category!=null -> WrongParametersError", async () => {
    try{
     await productDao.getAvailableProducts(null, "Smartphone", null)
     fail("it should break!")
   } catch(err){
     expect(err instanceof WrongParameterError).toBe(true);
    }
  });

  test("case grouping == null and model!=null -> WrongParametersError", async () => {
    try{
     await productDao.getAvailableProducts(null, null, "iphone17")
     fail("it should break!")
   } catch(err){
     expect(err instanceof WrongParameterError).toBe(true);
    }
  });

  test("case grouping == category and model!=null -> WrongParametersError", async () => {
    try{
     await productDao.getAvailableProducts("category", "Smartphone", "iphone17")
     fail("it should break!")
   } catch(err){
     expect(err instanceof WrongParameterError).toBe(true);
    }
  });

  test("case grouping == category and category==null -> WrongParametersError", async () => {
    try{
     await productDao.getAvailableProducts("category", null, null)
     fail("it should break!")
   } catch(err){
     expect(err instanceof WrongParameterError).toBe(true);
    }
  });

  test("case grouping == model and category!=null -> WrongParametersError", async () => {
    try{
     await productDao.getAvailableProducts("model", "Smartphone", "iPhone17")
     fail("it should break!")
   } catch(err){
     expect(err instanceof WrongParameterError).toBe(true);
    }
  });

  test("case grouping == model and model==null -> WrongParametersError", async () => {
    try{
     await productDao.getAvailableProducts("model", null, null)
     fail("it should break!")
   } catch(err){
     expect(err instanceof WrongParameterError).toBe(true);
    }
  });

  test("enter select -> rows emptyt -> ProductNotFoundError", async () => {
    const DBGet = mockAllOnce([], null);
    try{
     await productDao.getAvailableProducts("model", null, 'not existing model')
     fail("it should break!")
   } catch(err){
     expect(err instanceof ProductNotFoundError).toBe(true);
    }
  });

  test("enter select and grouping=model but model not available -> return []", async () => {
    const DBGet = mockAllOnce([{model: "modelNotAvailable", quantity: 0}], null);
     const result = await productDao.getAvailableProducts("model", null, 'not_existing_model')
     expect(result.length).toBe(0);
  });

  test("enter select and it works (it makes no sense to try all cases of response of DB in a mocked unit tests)", async () => {
    const mockDBGet = mockAllOnce([{model: "modelAvailable", quantity: 7}, {model: "model2Available", quantity: 3}], null)
    const mockDBRun = mockRunOnce(null);
    const result = await productDao.getAvailableProducts("model", null, 'existing_model');
     expect(result.length).toBe(2);
     expect(result[0].quantity).toBe(7);
     expect(result[1].quantity).toBe(3);
  });
});

/**
 * getProducts:
 * 1. case grouping == null and category!=null or model!=null -> WrongParameterError
 * 2. case grouping =="category" and category==null or model!=null-> WrongParameterError
 * 3. case grouping=="model" and model==null or category!=null-> WrongParameterError
 * 4. enter select -> rows empty -> ProductNotFoundError
 * 5. enter select and grouping=model but model not available -> return []
 * 6. enter select and it works (it makes no sense to try all cases in unit tests)
 */
describe("productDAO.getProducts", () => {

  test("case grouping == null and category!=null -> WrongParametersError", async () => {
    try{
     await productDao.getProducts(null, "Smartphone", null)
     fail("it should break!")
   } catch(err){
     expect(err instanceof WrongParameterError).toBe(true);
    }
  });

  test("case grouping == null and model!=null -> WrongParametersError", async () => {
    try{
     await productDao.getProducts(null, null, "iphone17")
     fail("it should break!")
   } catch(err){
     expect(err instanceof WrongParameterError).toBe(true);
    }
  });

  test("case grouping == category and model!=null -> WrongParametersError", async () => {
    try{
     await productDao.getProducts("category", "Smartphone", "iphone17")
     fail("it should break!")
   } catch(err){
     expect(err instanceof WrongParameterError).toBe(true);
    }
  });

  test("case grouping == category and category==null -> WrongParametersError", async () => {
    try{
     await productDao.getProducts("category", null, null)
     fail("it should break!")
   } catch(err){
     expect(err instanceof WrongParameterError).toBe(true);
    }
  });

  test("case grouping == model and category!=null -> WrongParametersError", async () => {
    try{
     await productDao.getProducts("model", "Smartphone", "iPhone17")
     fail("it should break!")
   } catch(err){
     expect(err instanceof WrongParameterError).toBe(true);
    }
  });

  test("case grouping == model and model==null -> WrongParametersError", async () => {
    try{
     await productDao.getProducts("model", null, null)
     fail("it should break!")
   } catch(err){
     expect(err instanceof WrongParameterError).toBe(true);
    }
  });

  test("enter select -> rows emptyt -> ProductNotFoundError", async () => {
    const DBGet = mockAllOnce([], null);
    try{
     await productDao.getProducts("model", null, 'not existing model')
     fail("it should break!")
   } catch(err){
     expect(err instanceof ProductNotFoundError).toBe(true);
    }
  });

  test("enter select and it works (it makes no sense to try all cases of response of DB in a mocked unit tests)", async () => {
    const mockDBGet = mockAllOnce([{model: "modelAvailable", quantity: 7}, {model: "model2Available", quantity: 3}], null)
    const mockDBRun = mockRunOnce(null);
    const result = await productDao.getProducts("model", null, 'existing_model');
     expect(result.length).toBe(2);
     expect(result[0].quantity).toBe(7);
     expect(result[1].quantity).toBe(3);
  });
});

describe("productDAO.deleteProduct", () => {
  test("product deleted", async () => {
    const productDao = new ProductDao();
    let mockedProductOb = {
      category: "test",
      quantity: 1,
      sellingPrice: 200
    }
    const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, mockedProductOb);
        return {} as Database;
      });
    const cartAndQuantity = [
      {cartd_id: 1, quantity: 2},
      {cartd_id: 2, quantity: 2},
    ]
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null,cartAndQuantity);
        return {} as Database;
      });
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {callback(null);
        return {} as Database;
      });
    const mockedUpdateCart = jest.spyOn(ProductDao.prototype, "updateCartTotal").mockResolvedValue()
    const result = await productDao.deleteProduct("Iphone13");
    expect(result).toBe(true);
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(expect.any(String),["Iphone13"],expect.any(Function));
    expect(db.all).toHaveBeenCalledTimes(1);
    expect(db.all).toHaveBeenCalledWith(expect.any(String),["Iphone13"],expect.any(Function));
    expect(db.run).toHaveBeenCalledTimes(1);
    expect(db.run).toHaveBeenCalledWith(expect.any(String),["Iphone13"],expect.any(Function));
    mockDBGet.mockRestore();
    mockDBAll.mockRestore();
    mockDBRun.mockRestore();
  })
  test("db get error #1", async () => {
    const productDao = new ProductDao();
    let mockedProductOb = {
      category: "test",
      quantity: 1,
      sellingPrice: 200
    }
    const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(new Error(""), undefined);
        return {} as Database;
      });
    const mockDBAll = jest.spyOn(db, "all")
    const mockDBRun = jest.spyOn(db, "run")
    const mockedUpdateCart = jest.spyOn(ProductDao.prototype, "updateCartTotal").mockResolvedValue()
    await expect(productDao.deleteProduct("Iphone13")).rejects.toThrow(new Error(""))
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(expect.any(String),["Iphone13"],expect.any(Function));
    expect(db.all).toHaveBeenCalledTimes(0);
    expect(db.run).toHaveBeenCalledTimes(0);
    mockDBGet.mockRestore();
    mockDBAll.mockRestore();
    mockDBRun.mockRestore();
  })
  test("Db get error #2", async () => {
    const productDao = new ProductDao();
    let mockedProductOb = {
      category: "test",
      quantity: 1,
      sellingPrice: 200
    }
    const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, undefined);
        return {} as Database;
      });
    const mockDBAll = jest.spyOn(db, "all")
    const mockDBRun = jest.spyOn(db, "run")
    const mockedUpdateCart = jest.spyOn(ProductDao.prototype, "updateCartTotal").mockResolvedValue()
    await expect(productDao.deleteProduct("Iphone13")).rejects.toThrow(new ProductNotFoundError())
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(expect.any(String),["Iphone13"],expect.any(Function));
    expect(db.all).toHaveBeenCalledTimes(0);
    expect(db.run).toHaveBeenCalledTimes(0);
    mockDBGet.mockRestore();
    mockDBAll.mockRestore();
    mockDBRun.mockRestore();
  })

  test("cart updated after deletion", async () => {
    const productDao = new ProductDao();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });
    const result = await productDao.updateCartTotal(1,100,'1');
    expect(result).toBeUndefined()
    expect(db.run).toHaveBeenCalledTimes(1);
    expect(db.run).toHaveBeenCalledWith(expect.any(String),[100,'1'],expect.any(Function));
    mockDBRun.mockRestore();
  })
  test("Db error, #3", async () => {
    const productDao = new ProductDao();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("db error"));
      return {} as Database;
    });
    await expect(productDao.updateCartTotal(1,100,'1')).rejects.toThrow(new Error("db error"))
    expect(db.run).toHaveBeenCalledTimes(1);
    mockDBRun.mockRestore();
  })
})

describe("productDAO.deleteAllProducts", () => {
  test("all products deleted", async () => {
    const productDao = new ProductDao();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });
    const result = await productDao.deleteAllProducts();
    expect(result).toBe(true);
    expect(db.run).toHaveBeenCalledTimes(2);
    mockDBRun.mockRestore();
  })
  test("db error", async () => {
    const productDao = new ProductDao();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("db error"));
      return {} as Database;
    });
    await expect(productDao.deleteAllProducts()).rejects.toThrow(new Error("db error"))
    expect(db.run).toHaveBeenCalledTimes(1);
    mockDBRun.mockRestore();
  })
})



describe("productDAO.sellProduct", () => {
  test("product sold in shop", async () => {
    const productDao = new ProductDao();
    const mockedModel = "Iphone13"
    const mockedQuantity = 2
    const sellingDate = new Date().toISOString().split('T')[0]
    let mockedProductOb = {
      model: "Iphone13",
      category: "test",
      quantity: 5,
      sellingPrice: 200,
      arrivalDate: "2024-05-01",
      details: ""
    }
    const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, mockedProductOb);
        return {} as Database;
      });
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {callback(null);
        return {} as Database;
      });
    const result = await productDao.sellProduct(mockedModel,mockedQuantity,sellingDate);
    expect(result).toBeUndefined();
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(expect.any(String),["Iphone13"],expect.any(Function));
    expect(db.run).toHaveBeenCalledTimes(1);
    expect(db.run).toHaveBeenCalledWith(expect.any(String),[3,sellingDate,"Iphone13"],expect.any(Function));
    mockDBGet.mockRestore();
    mockDBRun.mockRestore();
  })
  test("quantity error number sold >  quantity in stock", async () => {
    const productDao = new ProductDao();
    const mockedModel = "Iphone13"
    const mockedQuantity = 2
    const sellingDate = new Date().toISOString().split('T')[0]
    let mockedProductOb = {
      model: "Iphone13",
      category: "test",
      quantity: 1,
      sellingPrice: 200,
      arrivalDate: "2024-05-01",
      details: ""
    }
    const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, mockedProductOb);
        return {} as Database;
      });
    const mockDBRun = jest.spyOn(db, "run")
    await expect(productDao.sellProduct(mockedModel,mockedQuantity,sellingDate)).rejects.toThrow(new LowProductStockError());
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(expect.any(String),["Iphone13"],expect.any(Function));
    expect(db.run).toHaveBeenCalledTimes(0);
    mockDBGet.mockRestore();
    mockDBRun.mockRestore();
  })
  test("quantity error, stock is 0", async () => {
    const productDao = new ProductDao();
    const mockedModel = "Iphone13"
    const mockedQuantity = 2
    const sellingDate = new Date().toISOString().split('T')[0]
    let mockedProductOb = {
      model: "Iphone13",
      category: "test",
      quantity: 0,
      sellingPrice: 200,
      arrivalDate: "2024-05-01",
      details: ""
    }
    const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, mockedProductOb);
        return {} as Database;
      });
    const mockDBRun = jest.spyOn(db, "run")
    await expect(productDao.sellProduct(mockedModel,mockedQuantity,sellingDate)).rejects.toThrow(new ProductSoldError());
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(expect.any(String),["Iphone13"],expect.any(Function));
    expect(db.run).toHaveBeenCalledTimes(0);
    mockDBGet.mockRestore();
    mockDBRun.mockRestore();
  })
  test("product not found", async () => {
    const productDao = new ProductDao();
    const mockedModel = "Iphone13"
    const mockedQuantity = 2
    const sellingDate = new Date().toISOString().split('T')[0]
    let mockedProductOb = {
      model: "Iphone13",
      category: "test",
      quantity: 10,
      sellingPrice: 200,
      arrivalDate: "2024-05-01",
      details: ""
    }
    const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, undefined);
        return {} as Database;
      });
    const mockDBRun = jest.spyOn(db, "run")
    await expect(productDao.sellProduct(mockedModel,mockedQuantity,sellingDate)).rejects.toThrow(new ProductNotFoundError());
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(expect.any(String),["Iphone13"],expect.any(Function));
    expect(db.run).toHaveBeenCalledTimes(0);
    mockDBGet.mockRestore();
    mockDBRun.mockRestore();
  })
  test("selling date error, is > today", async () => {
    const productDao = new ProductDao();
    const mockedModel = "Iphone13"
    const mockedQuantity = 2
    const sellingDate = "3000-01-01"
    let mockedProductOb = {
      model: "Iphone13",
      category: "test",
      quantity: 0,
      sellingPrice: 200,
      arrivalDate: "2024-05-01",
      details: ""
    }
    const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, mockedProductOb);
        return {} as Database;
      });
    const mockDBRun = jest.spyOn(db, "run")
    await expect(productDao.sellProduct(mockedModel,mockedQuantity,sellingDate)).rejects.toThrow(new SellingDateError());
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(expect.any(String),["Iphone13"],expect.any(Function));
    expect(db.run).toHaveBeenCalledTimes(0);
    mockDBGet.mockRestore();
    mockDBRun.mockRestore();
  })
  test("selling date error, is < arrivalDate", async () => {
    const productDao = new ProductDao();
    const mockedModel = "Iphone13"
    const mockedQuantity = 2
    const sellingDate = "2000-01-01"
    let mockedProductOb = {
      model: "Iphone13",
      category: "test",
      quantity: 0,
      sellingPrice: 200,
      arrivalDate: "2024-05-01",
      details: ""
    }
    const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, mockedProductOb);
        return {} as Database;
      });
    const mockDBRun = jest.spyOn(db, "run")
    await expect(productDao.sellProduct(mockedModel,mockedQuantity,sellingDate)).rejects.toThrow(new SellingDateError());
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.get).toHaveBeenCalledWith(expect.any(String),["Iphone13"],expect.any(Function));
    expect(db.run).toHaveBeenCalledTimes(0);
    mockDBGet.mockRestore();
    mockDBRun.mockRestore();
  })
})