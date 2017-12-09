const express = require('express');
const employeeRouter = express.Router();
const timesheetsRouter = require('./timesheets');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
/*-------
EMPLOYEE ROUTER
--------*/
//PARAMS
employeeRouter.param('employeeId', (res, req, next, employeeId) => {
  const sql = 'SELECT * FROM Employee WHERE id = $employeeId';
  //Protect against SQL Injections
  const values = {$id: employeeId};
  db.get(sql, values, (err, employee) => {
    if(err){
      next(err);
    }else if(employee){
      //The employee actually exists, attach it to req so .get('/:id') doesn't have to search again
      req.employee = employee;
      next();
    }else{
      res.sendStatus(404);
    }
  });
});

//MIDDLEWARE
const employeeValidator = (req, res, next) => {
  //Ensure that all required data has been provided
  const employee = req.body.employee;
  if(!employee.name || !employee.wage || !employee.position){
    return res.sendStatus(400);
  }
  next();
}

//TIMESHEETS
employeeRouter.use('/:employeeId/timesheets/', timesheetsRouter);

//GET
employeeRouter.get('/', (res, req, next) => {
  //Get only employees who are currently working
  const sql = 'SELECT * FROM Employee WHERE is_currently_employed = 1';
  db.get(sql, (err, data) => {
    //Handle any errors
    if(err){
      next(err);
    }else{
      //Send back employees as JSON object
      res.status(200).json({employees: data})
    }
  });
});

employeeRouter.get('/:employeeId', (res, req, next) => {
  res.status(200).json({employee: req.employee});
});

//POST
employeeRouter.post('/', employeeValidator, (req, res, next) => {
  //Get employee from req, prepare sql & values
  const employee = req.body.employee;
  const sql = `INSERT INTO Employee(name, position, wage, is_currently_employed) VALUES ($name, $position, $wage, $is_currently_employed)`;
  const values = {
    $name: employee.name,
    $position: employee.position,
    $wage: employee.wage,
    $is_currently_employed: 1
  };
  db.run(sql, values, function(err){
    //Handle any errors
    if(err){
      next(err);
    }
    //Ensure the employee was inserted into the database
    db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`, (err, data) => {
      res.status(201).json({employee: data});
    });
  });
});

//PUT
employeeRouter.put('/:employeeId', employeeValidator, (res, req, next) => {
  const employee = req.body.employee;
  //Protect against SQL injections
  const sql = 'UPDATE Employee SET name = $name, position = $position, wage = $wage, is_currently_employed = $is_currently_employed WHERE Employee.id = $id';
  const values = {
    $name: employee.name,
    $position: employee.position,
    $wage: employee.wage,
    $is_currently_employed: employee.isCurrentlyEmployed,
    $id: req.params.employeeId
  };
  db.run(sql, values, function(err){
    //Handle any errors
    if(err){
      next(err);
    }
    //Ensure the update was applied to the database
    db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`, (err, data) => {
      res.status(200).json({employee: data});
    });
  });
});

//DELETE
employeeRouter.delete(':employeeId', (res, req, next) => {
  //Protect against SQL injections
  const sql = 'UPDATE Employee SET is_currently_employed = 0 WHERE Employee.id = $id';
  const values = {$id: req.params.employeeId};
  db.run(sql, values, (err) => {
    if(err){
      next(err);
    }
    //Employee successfully updated
    res.sendStatus(200);
  });
});

module.exports = employeeRouter;
