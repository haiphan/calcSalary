const csv = require('fast-csv');
const fs = require('fs');
// Wage rate
const HOUR_WAGE = 3.75;
const EVENING_WAGE = 1.15;
const OT2H = HOUR_WAGE * 0.25;
const OT4H = HOUR_WAGE * 0.5;
const OT4P = HOUR_WAGE;

function readDataFromCSV(csvFile) {
  return new Promise((res, rej) => {
    const rows = [];
    const stream = fs.createReadStream(csvFile);
    const csvStream = csv()
      .on('data', (data) => {
        if (!data[0] || data.length !== 5 || data[0] === 'Person Name') {
          return;
        }
        const [name, id, date, start, end] = data;
        rows.push({ name, id, date, start, end });
      })
      .on('end', () => res(rows))
      .on('error', (err) => {
        console.log('Failed to read CSV file');
        console.log(err);
        const newErr = new Error('Cannot read CSV file, check format');
        return rej(newErr);
      });

    stream.pipe(csvStream);
  });
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
    const hoursItem = {
      date,
      start: hourToMinute(start),
      end: hourToMinute(end),
    };
    if (salaryData[id]) {
      salaryData[id].hours.push(hoursItem);
      return false;
    }
    salaryData[id] = {
      name,
      hours: [hoursItem],
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

function hourToMinute(text) {
  const [h, m] = text.split(':').map(x => Number(x));
  const minutes = (h * 60) + m;
  return minutes;
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

function getHourWageM(data) {
  let wage = 0;
  data.map(({ start, end }) => {
    wage += minuteSubtract(start, end);
    return false;
  });
  wage *= (HOUR_WAGE / 60);
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

function getEveningWageM(data) {
  let wage = 0;
  const eveningTime = 18 * 60;
  data.map(({ start, end }) => {
    if (start >= eveningTime) {
      wage += minuteSubtract(start, end);
      return false;
    }
    if (end > eveningTime || end < start) {
      wage += minuteSubtract(eveningTime, end);
      return false;
    }
    return false;
  });
  wage *= (EVENING_WAGE / 60);
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

function getOvertimeWageM(data) {
  const normal = 8 * 60;
  const twoHour = 2 * 60;
  let overtime2h = 0;
  let overtime4h = 0;
  let overtime4p = 0;
  Object.keys(data).map((d) => {
    const dayMin = data[d].reduce((sum, item) => sum + minuteSubtract(item.start, item.end), 0);
    let overtimeMin = dayMin - normal;
    if (overtimeMin <= 0) {
      return false;
    }
    // overtime less than 2h
    if (overtimeMin <= twoHour) {
      overtime2h += overtimeMin;
      return false;
    }
    // overtime less than 4h
    overtime2h += twoHour;
    overtimeMin -= twoHour;
    if (overtimeMin <= twoHour) {
      overtime4h += overtimeMin;
      return false;
    }
    // overtime more than 4h
    overtime4h += twoHour;
    overtimeMin -= twoHour;
    overtime4p += overtimeMin;
    return false;
  });

  const wage = ((overtime2h * OT2H) + (overtime4h * OT4H) + (overtime4p * OT4P)) / 60;
  return wage;
}

function hourSubtract(start, end) {
  let duration = end - start;
  if (duration < 0) {
    duration += 24;
  }
  return duration;
}

function minuteSubtract(start, end) {
  let duration = end - start;
  if (duration < 0) {
    duration += (24 * 60);
  }
  return duration;
}

function roundFloat(inValue, inExp) {
  let value = inValue;
  let exp = inExp;
  if (typeof exp === 'undefined' || exp === 0) {
    return Math.round(value);
  }

  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
    return NaN;
  }

  value = Math.round(`${value}e${exp}`);
  exp *= -1;
  value = Number(`${value}e${exp}`);
  return value;
}

function calculateSalary(data) {
  const salaryData = {};
  Object.keys(data).map((p) => {
    let salary = getHourWageM(data[p].hours) +
      getEveningWageM(data[p].hours) +
      getOvertimeWageM(data[p].byDate);

    salary = roundFloat(salary, 2);
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
