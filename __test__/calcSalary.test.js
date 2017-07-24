const { formatCurrency, getSalaryFromCSV, readDataFromCSV, hourToNumber, hourSubtract } = require('../SalaryLogic');

const testCSV = './__test__/testHours.csv';


describe('Read salary from CSV', () => {
  test('Read CSV should succeed', async () => {
    const rows = await readDataFromCSV(testCSV);
    expect(rows.length).toEqual(6);
  });
  test('Get salary should succeed', async () => {
    const result = await getSalaryFromCSV(testCSV);
    expect(result['1'].name).toEqual('Donald');
    expect(result['1'].salary).toEqual('$7.50');
    expect(result['2'].salary).toEqual('$8.65');
    expect(result['3'].salary).toEqual('$50.88');
    expect(result['4'].salary).toEqual('$68.48');
  });
});

describe('Test util functions', () => {
  test('Hour to float should succeed', async () => {
    const hour = '6:20';
    expect(hourToNumber(hour)).toEqual(6.33);
  });
  test('Calculate hour should succeed', async () => {
    const start = 22;
    const end = 2.5;
    expect(hourSubtract(start, end)).toEqual(4.5);
  });
  test('Currency format should succeed', async () => {
    const money = 3.2;
    expect(formatCurrency(money)).toEqual('$3.20');
  });
});
