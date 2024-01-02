"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
      title: "testJob",
      salary: 150000,
      equity: "0.145",
      companyHandle: "c1"
    };
  
    test("works", async function () {
      let job = await Job.create(newJob);
     
      expect(job).toEqual({
        id: expect.any(Number), 
        title: newJob.title,
        salary: newJob.salary,
        equity: newJob.equity,
        companyHandle: newJob.companyHandle
      });
  
      
    });

    test("bad request with missing data", async function () {
        let job = {
            title: "testing",
            salary: 160000,
            equity: 0.187,
        };
    
        try {
            await Job.create(job);
        } catch (err) {
            expect(err instanceof Error).toBeTruthy();
        }
    });
});

// /************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "test",
        salary: 75000,
        equity: '0.87',
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "test2",
        salary: 100000,
        equity: '0',
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "test3",
        salary: 120000,
        equity: '0.012',
        companyHandle: "c2",
      },
    ]);
  });

  test("works: filter of just title", async () => {
    let jobs = await Job.findAll({ title: "test2"})

    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "test2",
            salary: 100000,
            equity: '0',
            companyHandle: "c2",
        }
    ])
  })

  test("works: filter of just minSalary", async () => {
    let jobs = await Job.findAll({ minSalary: 100000})

    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "test2",
        salary: 100000,
        equity: '0',
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "test3",
        salary: 120000,
        equity: '0.012',
        companyHandle: "c2",
      }
    ])
  })

  test("works: filter of just hasEquity", async () => {
    let jobs = await Job.findAll({ hasEquity: 'true'})

    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "test",
        salary: 75000,
        equity: '0.87',
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "test3",
        salary: 120000,
        equity: '0.012',
        companyHandle: "c2",
      }
    ])
  })

  test("works: filter of title and minSalary", async () => {
    let jobs = await Job.findAll({ title: "test", minSalary: 100000})

    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "test2",
            salary: 100000,
            equity: '0',
            companyHandle: "c2",
        },
        {
            id: expect.any(Number),
            title: "test3",
            salary: 120000,
            equity: '0.012',
            companyHandle: "c2",
        }
    ])
  }) 
  
  test("works: filter of title and hasEquity", async () => {
    let jobs = await Job.findAll({ title: "test", hasEquity: 'true'})

    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "test",
            salary: 75000,
            equity: '0.87',
            companyHandle: "c1",
        },
        {
            id: expect.any(Number),
            title: "test3",
            salary: 120000,
            equity: '0.012',
            companyHandle: "c2",
        }
    ])
  }) 

  test("works: minSalary and hasEquity", async () => {
    let jobs = await Job.findAll({ minSalary: 115000, hasEquity: 'true'})

    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "test3",
            salary: 120000,
            equity: '0.012',
            companyHandle: "c2",
        }
    ])
  })

  test("works: filter of title, minSalary, and hasEquity", async () => {
    let jobs = await Job.findAll({ title: "test", minSalary: 100000, hasEquity: 'true'})

    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "test3",
            salary: 120000,
            equity: '0.012',
            companyHandle: "c2",
        }
    ])
  })

  test("returns empty array of value that cannot be found", async function () {
    let jobs = await Job.findAll({ title: "invalid" });
    expect(jobs).toEqual([]);
  });

  test("bad request with invalid query filter title", async function() {
    await expect(async () => {
      await Job.findAll({invalid: "medical"})
    }).rejects.toThrow(BadRequestError)
  })
});

// /************************************** get */

describe("get", function () {
  test("works", async function () {
    let result = await db.query(
        `SELECT id, title, salary, equity, company_handle
        FROM jobs
        WHERE title='test'`);
    let job = result.rows[0]

    expect(job).toEqual({
      id: expect.any(Number),
      title: "test",
      salary: 75000,
      equity: "0.87",
      company_handle: "c1"
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** update */

describe("update", function () {
  const updateData = {
    title: "TEST",
    salary: 200000,
    equity: "0.98",
    companyHandle: "c1",
  };

  test("works", async function () {
    let result = await db.query(
        `SELECT id, title, salary, equity, company_handle
        FROM jobs
        WHERE title='test'`);
    let resultQuery = result.rows[0]

    let job = await Job.update(resultQuery.id, updateData);
    expect(job).toEqual({
      id: expect.any(Number),
      ...updateData,
    });
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null,
      companyHandle: "c1"
    };

    let result = await db.query(
        `SELECT id, title, salary, equity, company_handle
        FROM jobs
        WHERE title='test'`);
    let resultQuery = result.rows[0]

    let job = await Job.update(resultQuery.id, updateDataSetNulls);
    expect(job).toEqual({
        id: expect.any(Number),
      ...updateDataSetNulls,
    });
  });

  test("not found if no such job", async function () {
    try {
      let job = await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      let result = await db.query(
        `SELECT id, title, salary, equity, company_handle
        FROM jobs
        WHERE title='test'`);
      let resultQuery = result.rows[0]

      await Job.update(resultQuery.id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** remove */

describe("remove", function () {
  test("works", async function () {
    let result = await db.query(
        `SELECT id, title, salary, equity, company_handle
        FROM jobs
        WHERE title='test'`);
    let resultQuery = result.rows[0]

    await Job.remove(resultQuery.id);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=$1", [resultQuery.id]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
