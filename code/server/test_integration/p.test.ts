import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"


const routePath = "/ezelectronics" //Base route path for the API

const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" }
const iphone10 = {model: "iPhone10", category: "Smartphone", quantity: 5, details: "", "sellingPrice": 200, arrivalDate: "2024-01-01"}
const iphone2 = {model: "iPhone2", category: "Smartphone", quantity: 5, details: "", "sellingPrice": 200, arrivalDate: "2024-01-01"}
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let adminCookie: string
let customerCookie1: string
let managerCookie: string

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
        
}

const postProduct = async (producInfo: any) => {
    await request(app).post(`${routePath}/products`)
    .send(producInfo).set("Cookie", adminCookie)
}

//Helper function that logs in a user and returns the cookie
//Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

//Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
    await cleanup()
    await postUser(customer)
    await postUser(admin)
    await postUser(manager)
    customerCookie = await login(customer)
    adminCookie = await login(admin)
    managerCookie = await login(manager)
    await postProduct(iphone10)
    await postProduct(iphone2)
})

//After executing tests, we remove everything from our test database
afterAll(async() => {
    await cleanup()
})

describe("Product integration tests", () => {
  describe("POST ezelectronics/products", () => {
      test("Product added, code returned 200", async () => {
        const result = await request(app).post(`${routePath}/products`).send({model: "iPhone13", category: "Smartphone", quantity: 5, "sellingPrice": 200, arrivalDate: "2024-01-01"}).set("Cookie", adminCookie)
        expect(result.status).toBe(200)
      })
      test("Product already present, error 409", async () => {
        const result = await request(app).post(`${routePath}/products`).send({model: "iPhone13", category: "Smartphone", quantity: 5, details: "", "sellingPrice": 200, arrivalDate: "2024-01-01"}).set("Cookie", adminCookie)
        expect(result.status).toBe(409)
      })
      test("Product already present, error 400", async () => {
        const result = await request(app).post(`${routePath}/products`).send({model: "iPhone10", category: "Smartphone", quantity: 5, details: "", "sellingPrice": 200, arrivalDate: "3000-01-01"}).set("Cookie", adminCookie)
        expect(result.status).toBe(400)
      })
      test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
        await request(app).post(`${routePath}/products`).send({model: "", category: "Smartphone", quantity: 5, details: "", "sellingPrice": 200, arrivalDate: "2024-01-01"}).set("Cookie", adminCookie).expect(422) //We can repeat the call for the remaining body parameters
        await request(app).post(`${routePath}/products`).send({model: "iPhone13", category: "Invalid", quantity: 0, details: "", "sellingPrice": 200, arrivalDate: "2024-01-01"}).set("Cookie", adminCookie).expect(422)
        await request(app).post(`${routePath}/products`).send({model: "iPhone13", category: "Smartphone", quantity: 5, details: "", "sellingPrice": 0.0, arrivalDate: "2024-01-01"}).set("Cookie", adminCookie).expect(422)
        await request(app).post(`${routePath}/products`).send({model: "iPhone13", category: "Smartphone", quantity: 5, details: "", "sellingPrice": 200, arrivalDate: "test"}).set("Cookie", adminCookie).expect(422)
    })
  })

  describe("PATCH ezelectronics/products/:model", () => {
    test("Quantity increased, code 200", async () => {
      const body = {quantity: 2, changeDate: "2024-06-01"}
      const result = await request(app).patch(`${routePath}/products/iPhone13`).send(body).set("Cookie", adminCookie)
      expect(result.status).toBe(200)
      expect(result.body.quantity).toBe(7)
    })
    test("Product already present, error 404", async () => {
      const body = {quantity: 2, changeDate: "2024-06-01"}
      const result = await request(app).patch(`${routePath}/products/iphone10`).send(body).set("Cookie", adminCookie)
      expect(result.status).toBe(404)
    })
    test("It should return a 400 error if changeDate is after the current date", async () => {
      const body = {quantity: 2, changeDate: "3000-06-01"}
      const result = await request(app).patch(`${routePath}/products/iPhone13`).send(body).set("Cookie", adminCookie)
      expect(result.status).toBe(400)
    })
    test("It should return a 400 error if changeDate is before the product's arrivalDate", async () => {
      const body = {quantity: 2, changeDate: "2000-06-01"}
      const result = await request(app).patch(`${routePath}/products/iPhone13`).send(body).set("Cookie", adminCookie)
      expect(result.status).toBe(400)
    })
    test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
      await request(app).patch(`${routePath}/products/iPhone13`).send({quantity: -0, changeDate: "3000-06-01"}).set("Cookie", adminCookie).expect(422) //We can repeat the call for the remaining body parameters
      await request(app).patch(`${routePath}/products/iPhone13`).send({quantity: 2, changeDate: "qwerty"}).set("Cookie", adminCookie).expect(422)
    })
})

describe("PATCH ezelectronics/products/:model/sell", () => {
  test("Quantity increased, code 200", async () => {
    const body = {quantity: 7, sellingDate: "2024-06-01"}
    const result = await request(app).patch(`${routePath}/products/iPhone13/sell`).send(body).set("Cookie", adminCookie)
    expect(result.status).toBe(200)
  })
  test("It should return a 404 error if model does not represent a product in the database", async () => {
    const body = {quantity: 2, sellingDate: "2024-06-01"}
    const result = await request(app).patch(`${routePath}/products/invalid/sell`).send(body).set("Cookie", adminCookie)
    expect(result.status).toBe(404)
  })
  test("It should return a 400 error if sellingDate is after the current date", async () => {
    const body = {quantity: 2, sellingDate: "3000-06-01"}
    const result = await request(app).patch(`${routePath}/products/iPhone2/sell`).send(body).set("Cookie", adminCookie)
    expect(result.status).toBe(400)
  })
  test("It should return a 400 error if sellingDate is before the product's arrivalDate", async () => {
    const body = {quantity: 2, sellingDate: "2000-06-01"}
    const result = await request(app).patch(`${routePath}/products/iPhone2/sell`).send(body).set("Cookie", adminCookie)
    expect(result.status).toBe(400)
  })

  test("It should return a 409 error if the available quantity of model is lower than the requested quantity", async () => {
    const body = {quantity: 10, sellingDate: "2024-06-01"}
    const result = await request(app).patch(`${routePath}/products/iPhone2/sell`).send(body).set("Cookie", adminCookie)
    expect(result.status).toBe(409)
  })

  test("It should return a 409 error if model represents a product whose available quantity is 0", async () => {
    const body = {quantity: 10, sellingDate: "2024-06-01"}
    const result = await request(app).patch(`${routePath}/products/iPhone13/sell`).send(body).set("Cookie", adminCookie)
    expect(result.status).toBe(409)
  })

  test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
    await request(app).patch(`${routePath}/products/iPhone13/sell`).send({quantity: -0, sellingDate: "3000-06-01"}).set("Cookie", adminCookie).expect(422) //We can repeat the call for the remaining body parameters
    await request(app).patch(`${routePath}/products/iPhone13/sell`).send({quantity: 2, sellingDate: "qwerty"}).set("Cookie", adminCookie).expect(422)
  })
})

describe("GET ezelectronics/products", () => {
  test("All Products in database returned", async () => {
    const result = await request(app).get(`${routePath}/products`).send().set("Cookie", adminCookie)
    expect(result.status).toBe(200)
    const products = result.body
    expect(products).toHaveLength(3)
    
  })
  test("All the smartphones in database returned", async () => {
    const result = await request(app).get(`${routePath}/products?grouping=category&category=Smartphone&`).send().set("Cookie", adminCookie)
    expect(result.status).toBe(200)
    const products = result.body
    expect(products).toHaveLength(3)
  })
  test("code 404, model does not exist", async ()=>{
    const result = await request(app).get(`${routePath}/products?grouping=model&model=invalid&`).send().set("Cookie", adminCookie)
    expect(result.status).toBe(404)
  })
  test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
    await request(app).get(`${routePath}/products?grouping=category`).set("Cookie", adminCookie).expect(422)
    await request(app).get(`${routePath}/products?grouping=model&category=Smartphone&`).set("Cookie", adminCookie).expect(422)
    await request(app).get(`${routePath}/products?category=Smartphone&`).set("Cookie", adminCookie).expect(422) //We can repeat the call for the remaining body parameters
    await request(app).get(`${routePath}/products?grouping=category&model=invalid&`).set("Cookie", adminCookie).expect(422)
  })
})
describe("GET ezelectronics/products/available", () => {
  test("All Products in database returned", async () => {
    const result = await request(app).get(`${routePath}/products/available`).send().set("Cookie", adminCookie)
    expect(result.status).toBe(200)
    const products = result.body
    expect(products).toHaveLength(2)
    
  })
  test("All the smartphones in database returned", async () => {
    const result = await request(app).get(`${routePath}/products/available?grouping=category&category=Smartphone&`).send().set("Cookie", adminCookie)
    expect(result.status).toBe(200)
    const products = result.body
    expect(products).toHaveLength(2)
  })
  test("code 404, model does not exist", async ()=>{
    const result = await request(app).get(`${routePath}/products/available?grouping=model&model=invalid&`).send().set("Cookie", adminCookie)
    expect(result.status).toBe(404)
  })
  test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
    await request(app).get(`${routePath}/products/available?grouping=category`).set("Cookie", adminCookie).expect(422)
    await request(app).get(`${routePath}/products/available?grouping=model&category=Smartphone&`).set("Cookie", adminCookie).expect(422)
    await request(app).get(`${routePath}/products/available?category=Smartphone&`).set("Cookie", adminCookie).expect(422) //We can repeat the call for the remaining body parameters
    await request(app).get(`${routePath}/products/available?grouping=category&model=invalid&`).set("Cookie", adminCookie).expect(422)
  })
})

describe("DELETE ezelectronics/products/:model", () => {
  test("Product deleted, error 200", async () => {
    const result = await request(app).delete(`${routePath}/products/iPhone13`).send().set("Cookie", managerCookie)
    expect(result.status).toBe(200)
    
  })
  test("code 404, model does not exist", async ()=>{
    const result = await request(app).delete(`${routePath}/products/invalid`).send().set("Cookie", adminCookie)
    expect(result.status).toBe(404)
  })
  test("code 401, unauthorized", async ()=>{
    const result = await request(app).delete(`${routePath}/products/iPhone2`).send().set("Cookie", customerCookie)
    expect(result.status).toBe(401)
  })
})

describe("DELETE ezelectronics/products", () => {
  test("Product deleted, error 200", async () => {
    const result = await request(app).delete(`${routePath}/products`).send().set("Cookie", managerCookie)
    expect(result.status).toBe(200)
  })
  test("error 401, unauthorized", async () => {
    const result = await request(app).delete(`${routePath}/products`).send().set("Cookie", customerCookie)
    expect(result.status).toBe(401)
  })
})

})