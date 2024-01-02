process.env.NODE_ENV = 'test'

const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

const jsToSql = {
    firstName: "first_name",
    lastName: "last_name",
    isAdmin: "is_admin",
} 

describe("Test sqlForPartialUpdate Function", () => {
    test("Testing valid response of function", () => {
        const dataToUpdate = {
            "firstName": "Vera",
            "lastName": "Nouaime",
            "email": "test@gmail.com"
        }

        const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql)

        expect(Object.keys(dataToUpdate).length).toEqual(3)
        expect(setCols).toEqual('"first_name"=$1, "last_name"=$2, "email"=$3')
        expect(values).toEqual([ 'Vera', 'Nouaime', 'test@gmail.com' ])
    })

    test("Testing no dataToUpdate resulting in BadRequestError", () => {
        const dataToUpdate = {}

        expect(Object.keys(dataToUpdate).length).toEqual(0)
        expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql)).toThrow(BadRequestError);
    })

    test("Testing only 2 items to change for user", () => {
        const dataToUpdate = {
            "firstName": "Vera",
            "lastName": "Nouaime",
        }

        const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql)

        expect(Object.keys(dataToUpdate).length).toEqual(2)
        expect(setCols).toEqual('"first_name"=$1, "last_name"=$2')
        expect(values).toEqual([ 'Vera', 'Nouaime' ])
    })
})