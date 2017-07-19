const fs = require('fs');
const { getSalaryFromCSV, printToConsole } = require('./SalaryLogic');

// ---program starts here
const csvFile = process.argv[2];
if (!csvFile) {
  console.log('specify a csv file');
  process.exit(1);
}

try {
  fs.accessSync(csvFile, fs.F_OK);
  getSalaryFromCSV(csvFile).then((res) => {
    printToConsole(res);
    process.exit(0);
  }).catch((err) => {
    console.log('Some error has occurred');
    console.log(err);
  });
} catch (e) {
  console.log('cannot access file!');
  console.log(e);
  process.exit(1);
}

