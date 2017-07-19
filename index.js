const restify = require('restify');
const SalaryLogic = require('./SalaryLogic');

const server = restify.createServer({
  name: 'SalaryCalculation',
});

const PORT = process.env.PORT || 8899;
let salaryData;

function getSalary(req, res, next) {
  if (!salaryData[req.params.id]) {
    res.status(400);
    res.send('Resource Not Found!');
    return next();
  }
  res.send(salaryData[req.params.id]);
  return next();
}

server.get('/', (req, res, next) => {
  res.send('It works!');
  return next();
});

server.get('/salary/:id', getSalary);

server.use((req, res, next) => {
  res.status(400);
  res.send('Resource Not Found!');
  return next();
});

SalaryLogic.getSalaryFromCSV('HourList201403.csv').then((salary) => {
  salaryData = salary;
  server.listen(PORT, () => console.log('server started on port', PORT));
}).catch((err) => {
  console.log('Cannot perform operation');
  console.log(err);
});
