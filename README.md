# Salary Calculation

### Install libraries
Install with npm.
```sh
$ npm install
```
### Run from command line 
Read from CSV file and output salary to command line.
```sh
$ node calcSalary MonthlyWageCalculationSystem_20170317_2.pdf
# or
$ npm run cmd
```
### REST API
A server is run to provide data for salary.
```sh
GET /salary/:id
```
If the user id is matched data will be returned in JSON format.


To run the server
```sh
$ npm start
```

### Testing
We are using jest for testing. Test files are located in dir.
```sh
__test__
```
Run all tests with

```sh
$ npm test
```