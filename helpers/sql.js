const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.


/*
  Function makes updating psql users table more dynamic and less cluttered by making the SET clause here. Will allow code to be updated in one spot of the function where it is being used instead of multiple spots. 

  If error, BadRequestError is thrown.
  
  dataToUpdate = data given by user to update 
    {
      firstName: 'updateTestFirstName',
      lastName: 'updateTestLastName',
      email: 'updatetestemail@gmail.com'
    }

  jsToSql = dictionary that has json keys with their values being column names from the user table in psql 
    {
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin",
    }

  Returs object {
    setCols: string of users table columns that are going to be updated with placeholder values to be used in parameterized queries.
      = "first_name"=$1, "last_name"=$2, "email"=$3

    values: array of values of user's desired updates from the keys of dataToUpdate.
      = ['updateTestFirstName', 'updateTestLastName', 'updatetestemail@gmail.com']
  }
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
