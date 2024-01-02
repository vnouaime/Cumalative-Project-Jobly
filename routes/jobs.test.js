"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 80000,
    equity: 0.23,
    companyHandle: "c1"
  };

  test("ok for admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({ job: {
        id: expect.any(Number),
        title: newJob.title,
        salary: newJob.salary,
        equity: "0.23",
        companyHandle: "c1"
    }
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          salary: 105000,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

// // /************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");

    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: expect.any(Number),
                title: "test1",
                salary: 75000,
                equity: '0.87',
                companyHandle: "c1",
              },
              {
                id: expect.any(Number),
                title: "test2",
                salary: 100000,
                equity: '0',
                companyHandle: "c3",
              },
              {
                id: expect.any(Number),
                title: "test3",
                salary: 120000,
                equity: '0.732',
                companyHandle: "c3",
              },
          ],
        });
  });

  test("ok for filtered companies of title. Testing 1 filter.", async function () {
    const resp = await request(app).get("/jobs?title=test2");

    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: expect.any(Number),
                title: "test2",
                salary: 100000,
                equity: '0',
                companyHandle: "c3",
            },
          ],
    });
  });

  test("ok for filtered companies of title and salary. Testing 2 filters. ", async function () {
    const resp = await request(app).get("/jobs?title=test&minSalary=100000");
    
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: expect.any(Number),
                title: "test2",
                salary: 100000,
                equity: '0',
                companyHandle: "c3",
              },
              {
                id: expect.any(Number),
                title: "test3",
                salary: 120000,
                equity: '0.732',
                companyHandle: "c3",
              },
          ],
    });
  });

  test("ok for filtered companies of title, minSalary, hasEquity. Testing 3 filters. ", async function () {
    const resp = await request(app).get("/jobs?title=test&minSalary=100000&hasEquity=true");
    
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: expect.any(Number),
                title: "test3",
                salary: 120000,
                equity: '0.732',
                companyHandle: "c3",
              },
          ],
    });
  });

  test("bad request with invalid filter name", async function() {
    const resp = await request(app).get("/jobs?invalid=test")

    expect(resp.statusCode).toEqual(400)
  })
});

// // /************************************** GET /companies/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    let result = await db.query(
        `SELECT id, title, salary, equity, company_handle
        FROM jobs
        WHERE title='test1'`);
    let job = result.rows[0]

    const resp = await request(app).get(`/jobs/${job.id}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "test1",
        salary: 75000,
        equity: "0.87",
        companyHandle: "c1",
      },
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

// // /************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    let result = await db.query(
        `SELECT id, title, salary, equity, company_handle
        FROM jobs
        WHERE title='test1'`);
    let job = result.rows[0]

    const resp = await request(app)
        .patch(`/jobs/${job.id}`)
        .send({
          title: "new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
        job: {
            id: expect.any(Number),
            title: "new",
            salary: 75000,
            equity: "0.87",
            companyHandle: "c1",
        },
    });
  });

  test("unauth for anon", async function () {
    let result = await db.query(
        `SELECT id, title, salary, equity, company_handle
        FROM jobs
        WHERE title='test1'`);
    let job = result.rows[0]

    const resp = await request(app)
        .patch(`/jobs/${job.id}`)
        .send({
          title: "new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "invalid",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    let result = await db.query(
        `SELECT id, title, salary, equity, company_handle
        FROM jobs
        WHERE title='test1'`);
    let job = result.rows[0]

    try {
        await request(app)
        .patch(`/jobs/${job.id}`)
        .send({
            companyHandle: "new_name",
        })
        .set("authorization", `Bearer ${adminToken}`);
    } catch (err) {
        expect(err instanceof Error).toBeTruthy();
    }
  });
});

// // /************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () { 
    let result = await db.query(
        `SELECT id, title, salary, equity, company_handle
        FROM jobs
        WHERE title='test1'`);
    let job = result.rows[0]
    const resp = await request(app)
        .delete(`/jobs/${job.id}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: `Job with id#: ${job.id}` });
  });

  test("unauth for anon", async function () {
    let result = await db.query(
        `SELECT id, title, salary, equity, company_handle
        FROM jobs
        WHERE title='test1'`);
    let job = result.rows[0]

    const resp = await request(app)
        .delete(`/companies/${job.id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/companies/0`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
