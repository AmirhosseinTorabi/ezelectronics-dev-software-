import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"

const routePath = "/ezelectronics" //Base route path for the API

const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const customer1 = { username: "customer1", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" }
const iphone13 = {model: "iPhone13", category: "Smartphone", quantity: 5, details: "", "sellingPrice": 200, arrivalDate: "2024-01-01"}
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
    await postUser(customer1)
    await postUser(admin)
    await postUser(manager)
    customerCookie = await login(customer)
    adminCookie = await login(admin)
    customerCookie1 = await login(customer1)
    managerCookie = await login(manager)
    await postProduct(iphone13)
})

//After executing tests, we remove everything from our test database
afterAll(async() => {
    await cleanup()
})


describe("User routes integration tests", () => {
    describe("POST ezelectronics/reviews/:model", () => {
        test("It should return 200, review added", async () => {
            const body = {score: 5, comment: "A very cool smartphone!"}
            const result = await request(app).post(`${routePath}/reviews/iPhone13`).set("Cookie", customerCookie).send(body)
            expect(result.status).toBe(200)
        })
        test("It should return 404, review added", async () => {
            const body = {score: 5, comment: "A very cool smartphone!"}
            const result = await request(app).post(`${routePath}/reviews/giovanni`).set("Cookie", customerCookie).send(body)
            expect(result.status).toBe(404)
        })
        test("It should return 409, review already presents", async () => {
            const body = {score: 5, comment: "A very cool smartphone!"}
            const result = await request(app).post(`${routePath}/reviews/iPhone13`).set("Cookie", customerCookie).send(body)
            expect(result.status).toBe(409)
        })
        test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
            await request(app).post(`${routePath}/reviews/iPhone13`).set("Cookie", customerCookie).send({score: 0, comment: "A very cool smartphone!"}).expect(422) //We can repeat the call for the remaining body parameters
            await request(app).post(`${routePath}/reviews/iPhone13`).set("Cookie", customerCookie).send({score: 5}).expect(422)
            await request(app).post(`${routePath}/reviews/iPhone13`).set("Cookie", customerCookie).send({comment: "test"}).expect(422)
            await request(app).post(`${routePath}/reviews/iPhone13`).set("Cookie", customerCookie).send({score: 5, comment: null}).expect(422)
        })
    })

    describe("GET ezelectronics/reviews/:model", () => {
        test("It should return 200, reviews got", async () => {
            
            const result = await request(app).get(`${routePath}/reviews/iPhone13`).set("Cookie", customerCookie).send()
            expect(result.status).toBe(200)
            let reviews = result.body
            expect(reviews).toHaveLength(1)
            expect(reviews[0].score).toBe(5) //added in a previous test
            expect(reviews[0].comment).toBe("A very cool smartphone!")
        })
        test("It should return 404, product not found", async () => {
            const result = await request(app).get(`${routePath}/reviews/giovanni`).set("Cookie", customerCookie).send()
            expect(result.status).toBe(404)
        })
        test("It should return 401, not authorized", async () => {
            const result = await request(app).get(`${routePath}/reviews/giovanni`).send()
            expect(result.status).toBe(401)
            
        })
    })
    describe("DELETE ezelectronics/reviews/:model", () => {
        test("It should return 200, reviews deleted", async () => {
            const result = await request(app).delete(`${routePath}/reviews/iPhone13`).set("Cookie", customerCookie).send()
            expect(result.status).toBe(200)
        })
        test("It should return 404, model not exists", async () => {
            const result = await request(app).delete(`${routePath}/reviews/giovanni`).set("Cookie", customerCookie).send()
            expect(result.status).toBe(404)
        })
        test("It should return a 404 error if the current user does not have a review for the product identified by model", async () => {
            const result = await request(app).delete(`${routePath}/reviews/iPhone13`).set("Cookie", customerCookie).send()
            expect(result.status).toBe(404)
            
        })
        test("It should return 401, not authorized", async () => {
            const result = await request(app).delete(`${routePath}/reviews/iPhone13`).set("Cookie", adminCookie).send()
            expect(result.status).toBe(401)
            
        })
    })

    describe("DELETE ezelectronics/reviews/:model/all", () => {
        test("It should return 200, reviews deleted", async () => {
            const body = {score: 5, comment: "A very cool smartphone!"}
            await request(app).post(`${routePath}/reviews/iPhone13`).set("Cookie", customerCookie).send(body)
            await request(app).post(`${routePath}/reviews/iPhone13`).set("Cookie", customerCookie1).send(body)
            const result = await request(app).delete(`${routePath}/reviews/iPhone13/all`).set("Cookie", managerCookie).send()
            expect(result.status).toBe(200)
        })
        test("It should return 404, model not exists", async () => {
            const result = await request(app).delete(`${routePath}/reviews/giovanni/all`).set("Cookie", adminCookie).send()
            expect(result.status).toBe(404)
        })
        test("It should return 401, not authorized", async () => {
            const result = await request(app).delete(`${routePath}/reviews/iPhone13/all`).set("Cookie", customerCookie).send()
            expect(result.status).toBe(401)
            
        })
    })

    describe("DELETE ezelectronics/reviews/", () => {
        test("It should return 200, all reviews deleted", async () => {
            const body = {score: 5, comment: "A very cool smartphone!"}
            await request(app).post(`${routePath}/reviews/iPhone13`).set("Cookie", customerCookie).send(body)
            await request(app).post(`${routePath}/reviews/iPhone13`).set("Cookie", customerCookie1).send(body)
            const result = await request(app).delete(`${routePath}/reviews`).set("Cookie", managerCookie).send()
            expect(result.status).toBe(200)
        })
        test("It should return 401, not authorized", async () => {
            const result = await request(app).delete(`${routePath}/reviews`).set("Cookie", customerCookie).send()
            expect(result.status).toBe(401)
            
        })
    })
})





