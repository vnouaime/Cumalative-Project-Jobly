"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * 
   * Result is based on parameters in searchFilters. 
   * Function will add search parameters to query if any are passed in and return results from db
   * Throws BadRequestError if invalid query is passed through
   * Throws BadRequestError if minEmployees > maxEmployees
   * */

  static async findAll(searchFilters = {}) {
    const allowedFilters = ['name', 'minEmployees', 'maxEmployees'];

    // Check if any other filter is present
    const invalidFilters = Object.keys(searchFilters).filter(key => !allowedFilters.includes(key));

    if (invalidFilters.length > 0) {
      throw new BadRequestError(`Invalid filter(s): ${invalidFilters.join(', ')}`);
    }

    let { name, minEmployees, maxEmployees } = searchFilters

    if (minEmployees > maxEmployees) {
      throw new BadRequestError("minEmployees cannot be greater than maxEmployees")
    }

    // Query right now only handles selection of all companies
    let query = `SELECT handle,
                        name,
                        description,
                        num_employees AS "numEmployees",
                        logo_url AS "logoUrl"
                 FROM companies`;
    // Holds all filter expressions for query
    let expressions = [];
    
    // Holds filter parameters to insert into query
    let queryArray = [];
  
    if (name !== undefined) {
      queryArray.push(`%${name}%`)
      expressions.push(`name ILIKE $${queryArray.length}`)
    }

    if (minEmployees !== undefined) {
      queryArray.push(minEmployees)
      expressions.push(`num_employees >= $${queryArray.length}`)
    }

    if (maxEmployees !== undefined) {
      queryArray.push(maxEmployees) 
      expressions.push(`num_employees <= $${queryArray.length}`)
    }
    
    if (expressions.length > 0) {
      query += " WHERE " + expressions.join(" AND ");
    }
    
    query += " ORDER BY name";
    const companiesRes = await db.query(query, queryArray);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
  **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT c.handle,
                  c.name,
                  c.description,
                  c.num_employees AS "numEmployees",
                  c.logo_url AS "logoUrl", 
                  j.id, 
                  j.title, 
                  j.salary, 
                  j.equity
           FROM companies AS "c"
           LEFT JOIN jobs AS "j" ON c.handle = j.company_handle
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows;

    if (!company[0]) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
