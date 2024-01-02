"use strict";

const db = require("../db")

const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
  } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
    /** Create a job (from data), update db, return new job data.
     * 
     * data should be { title, salary, equity, companyHandle }
     * 
     * Returns { id, title, salary, equity, companyHandle }
     * 
     * Throws BadRequestError if job already in database.
     */

    static async create({ title, salary, equity, companyHandle }) {
        const result = await db.query(
            `INSERT INTO jobs
            (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                title, 
                salary, 
                equity, 
                companyHandle
            ]
        )
        const job = result.rows[0]

        return job;
    }

    /** Find all jobs.
   *
   * Returns [{ title, salary, equity, companyHandle }, ...]
   * 
   * Result is based on parameters in searchFilters. 
   * Function will add search parameters to query if any are passed in and return results from db
   * Throws BadRequestError if invalid query is passed through
   * */

    static async findAll(searchFilters = {}) {
        const allowedFilters = ['title', 'minSalary', 'hasEquity']

        // Check if any other filter is present 
        const invalidFilters = Object.keys(searchFilters).filter(key => !allowedFilters.includes(key));

        if (invalidFilters.length > 0) {
            throw new BadRequestError(`Invalid filter(s): ${invalidFilters.join(', ')}`);
        }

        let { title, minSalary, hasEquity } = searchFilters

        // Query right now only handles selection of all companies
        let query = `SELECT id,
                            title,
                            salary,
                            equity,
                            company_handle AS "companyHandle"
                    FROM jobs`;
        // Holds all filter expressions for query
        let expressions = [];

        // // Holds filter parameters to insert into query
        let queryArray = [];

        if (title !== undefined) {
            queryArray.push(`%${title}%`)
            expressions.push(`title ILIKE $${queryArray.length}`)
        }

        if (minSalary !== undefined) {
            queryArray.push(minSalary)
            expressions.push(`salary >= $${queryArray.length}`)
        }

        
        if (hasEquity === 'true') {
            expressions.push(`equity > 0`)
        }

        if (expressions.length > 0) {
            query += " WHERE " + expressions.join(" AND ");
        }

        query += " ORDER BY id";
        const jobsRes = await db.query(query, queryArray);
        return jobsRes.rows;
    }

    /** Given a job id, return data about job.
    *
    * Returns { id, title, salary, equity, companyHandle }
    *
    * Throws NotFoundError if not found.
    **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id, 
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
            FROM jobs 
            WHERE id = $1`,
            [id]);
        
        const job = jobRes.rows[0]

        if (!job) throw new NotFoundError(`No job found with id: ${id}`)

        return job
    }

    /** Update job data with `data`
     * 
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: { salary, equity }
     *
     * Returns { id, title, salary, equity, companyHandle}
     *
     * Throws NotFoundError if not found.
     */

    static async update (id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data, 
            {
                companyHandle: "company_handle"
            });
        const handleVarIdx = "$" + (values.length + 1)

        const querySql = `UPDATE jobs 
                          SET ${setCols}
                          WHERE id = ${handleVarIdx}
                          RETURNING id,
                                    title, 
                                    salary, 
                                    equity, 
                                    company_handle AS "companyHandle"`;

        const result = await db.query(querySql, [...values, id]);

        const job = result.rows[0]

        if (!job) throw new NotFoundError(`No job found with id: ${id}`)

        return job
    }

    /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job found with id: ${id}`)
  }
}

module.exports = Job;