import fs from "fs";

const filePath = "./data/DEXINUS.csv";

const raw = fs.readFileSync(filePath, "utf8");

const lines = raw.trim().split("\n");
const headers = lines[0].split(",");

const rows = lines.slice(1).map(line => {
  const [date, value] = line.split(",");

  return {
    date,
    value: value === "" ? null : Number(value)
  };
});

const validRows = rows.filter(row => row.value !== null);
const missingRows = rows.filter(row => row.value === null);

const values = validRows.map(row => row.value);

const dates = validRows.map(row => row.date);

const duplicates = dates.filter(
  (date, index) => dates.indexOf(date) !== index
);

console.log("\n========== 1ZZ DATASET INSPECTION ==========\n");

console.log(`Total rows:        ${rows.length}`);
console.log(`Valid observations:${validRows.length}`);
console.log(`Missing values:    ${missingRows.length}`);
console.log(`Duplicate dates:   ${duplicates.length}`);

console.log(`\nEarliest date:     ${validRows[0].date}`);
console.log(`Latest date:       ${validRows[validRows.length - 1].date}`);

console.log(`\nMinimum USD/INR:   ${Math.min(...values)}`);
console.log(`Maximum USD/INR:   ${Math.max(...values)}`);

console.log(`\nLatest USD/INR:    ${validRows[validRows.length - 1].value}`);

console.log("\n=============================================\n");