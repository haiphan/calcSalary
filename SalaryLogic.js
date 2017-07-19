const Promise = require('bluebird');
const csv = require('fast-csv');
const fs = require('fs');
// Wage rate
const HOUR_WAGE = 3.75;
const EVENING_WAGE = 1.15;
const OT2H = HOUR_WAGE * 0.25;
const OT4H = HOUR_WAGE * 0.5;
const OT4P = HOUR_WAGE;

function readDataFromCSV(csvFile) {
  return new Promise(((res, rej) => {
    const rows = [];
    const stream = fs.createReadStream(csvFile);
    const csvStream = csv()
      .on('data', (data) => {
        if (!data[0] || data.length !== 5 || data[0] === 'Person Name') {
          return;
        }
        rows.push({
          name: data[0],
          id: data[1],
          date: data[2],
          start: data[3],
          end: data[4],
        });
      })
      .on('end', () => res(rows))
      .on('error', (err) => {
        console.log('Failed to read CSV file');
        console.log(err);
        const newErr = new Error('Cannot read CSV file, check format');
        return rej(newErr);
      });

    stream.pipe(csvStream);
  }));
}

function getSalaryFromCSV(csvFile) {
  return readDataFromCSV(csvFile).then((res) => {
    console.log('Read CSV done');
    let salaryData = sortByPersonAndDate(res);
    salaryData = calculateSalary(salaryData);
    return salaryData;
  });
}

function printToConsole(data) {
  console.log('###Salary info');
  Object.keys(data).map((id) => {
    console.log(`id: ${id}, name: ${data[id].name}, salary: ${data[id].salary}`);
    return false;
  });
}

function sortByPersonAndDate(data) {
  const salaryData = {};
  data.map(({ id, name, date, start, end }) => {
    if (salaryData[id]) {
      salaryData[id].hours.push({
        date,
        start: hourToNumber(start),
        end: hourToNumber(end),
      });
      return false;
    }
    salaryData[id] = {
      name,
      hours: [{
        date,
        start: hourToNumber(start),
        end: hourToNumber(end),
      }],
    };
    return false;
  });

  Object.keys(salaryData).map((id) => {
    if (!salaryData[id].byDate) {
      salaryData[id].byDate = {};
    }
    salaryData[id].hours.map(({ date, start, end }) => {
      if (!salaryData[id].byDate[date]) {
        salaryData[id].byDate[date] = [{ start, end }];
        return false;
      }
      salaryData[id].byDate[date].push({ start, end });
      return false;
    });
    return false;
  });

  return salaryData;
}

function hourToNumber(text) {
  const hm = text.split(':');
  const h = Number(hm[0]);
  const m = Number(hm[1]);
  const hourFloat = Math.round((h + (m / 60)) * 100) / 100;
  return hourFloat;
}

function getHourWage(data) {
  let wage = 0;
  data.map(({ start, end }) => {
    wage += hourSubtract(start, end);
    return false;
  });
  wage *= HOUR_WAGE;
  return wage;
}

function getEveningWage(data) {
  let wage = 0;
  data.map(({ start, end }) => {
    if (start >= 18) {
      wage += hourSubtract(start, end);
      return false;
    }
    if (end > 18 || end < start) {
      wage += hourSubtract(18, end);
      return false;
    }
    return false;
  });
  wage *= EVENING_WAGE;
  return wage;
}

function groupByDate(data) {
  const hourByDate = {};
  data.map(({ date, start, end }) => {
    if (hourByDate[date]) {
      hourByDate[date].hours.push({ start, end });
    }
    return false;
  });
  return hourByDate;
}

function getOvertimeWage(data) {
  let wage = 0;
  Object.keys(data).map((d) => {
    const dayHours = data[d].reduce((sum, item) => sum + hourSubtract(item.start, item.end), 0);
    let overtime = dayHours - 8;
    if (overtime <= 0) {
      return false;
    }
    // overtime less than 2h
    if (overtime <= 2) {
      wage += (overtime * OT2H);
      return false;
    }
    // overtime less than 4h
    wage += (2 * OT2H);
    overtime -= 2;
    if (overtime <= 2) {
      wage += (overtime * OT4H);
      return false;
    }
    // overtime more than 4h
    wage += (2 * OT4H);
    overtime -= 2;
    wage += (overtime * OT4P);
    return false;
  });

  return wage;
}

function hourSubtract(start, end) {
  let duration = end - start;
  if (duration < 0) {
    duration += 24;
  }
  return duration;
}

function calculateSalary(data) {
  const salaryData = {};
  Object.keys(data).map((p) => {
    let salary = getHourWage(data[p].hours) +
      getEveningWage(data[p].hours) +
      getOvertimeWage(data[p].byDate);
    salary = Math.round((salary * 100)) / 100;
    salary = formatCurrency(salary);
    salaryData[p] = {
      name: data[p].name,
      salary,
    };
    return false;
  });
  return salaryData;
}

function formatCurrency(n) {
  const dollar = '$';
  let res = `${dollar}${n.toString()}`;
  if (res.indexOf('.') === -1) {
    return `${res}.00`;
  }
  const [, cents] = res.split('.');
  if (cents.length === 1) {
    res = `${res}0`;
  }
  return res;
}

module.exports = {
  readDataFromCSV,
  sortByPersonAndDate,
  groupByDate,
  hourToNumber,
  getHourWage,
  getEveningWage,
  getOvertimeWage,
  hourSubtract,
  calculateSalary,
  getSalaryFromCSV,
  printToConsole,
  formatCurrency,
};
