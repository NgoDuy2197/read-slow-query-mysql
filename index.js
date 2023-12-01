const fs = require('fs');
const moment = require('moment');
const DATA_FORMAT = "DD/MM/YYYY HH:mm:ss"

// Input file path
const inputFilePath = './input/file.txt';
// Output file path
const outputFilePath = './output/file.csv';
let splitChar = "❤"
let logPerRows = 100000

// Read from file
const readFile = (filePath) => {
  return fs.readFileSync(filePath, 'utf-8');
};

// Check row is not needed
const isNeededLine = (line) => {
  let isNeeded = true
  let notNeededTextArr = ["# User@Host:", "SET timestamp", "/usr/sbin/mysqld, Version: 8.0.25", "Tcp port: 3306  Unix socket", "Time                 Id Command    Argument"]
  for (let text of notNeededTextArr) {
    if (line.startsWith(text)) {
      isNeeded = false
      break
    }
  }
  return isNeeded
}

// Show Progress
const showLog = (total, count, perRows) => {
  if ((total == count) || (count % perRows == 0)) {
    console.log(`Scan [${parseFloat(count/total*100).toFixed(2)}%] -> ${count}/${total}`)
  }
}

// Convert data
const parseData = (data) => {
  const entries = [];
  const lines = data.split('\n');
  const linesLength = lines.length

  let sqlTemp = "", count = 0, entry = {}
  lines.forEach((line) => {
    count++
    showLog(linesLength, count, logPerRows)
    if (isNeededLine(line)) {
      let lineData = line.trim()
      if (lineData.startsWith("# Time: ")) {
        entry.time = moment(lineData.replace("# Time: ", "")).format(DATA_FORMAT)
      } else if (lineData.startsWith("# Query_time: ")) {
        let arrParts = [], arrTemp = []
        arrTemp = lineData.split("# Query_time: ")
        arrTemp = arrTemp[1].split("  Lock_time: ")
        arrParts.push(arrTemp[0])
        arrTemp = arrTemp[1].split(" Rows_sent: ")
        arrParts.push(arrTemp[0])
        arrTemp = arrTemp[1].split("  Rows_examined: ")
        arrParts.push(arrTemp[0])
        arrParts.push(arrTemp[1])
        entry.query_time = arrParts[0]
        entry.lock_time = arrParts[1]
        entry.rows_sent = arrParts[2]
        entry.rows_examined = arrParts[3]
      } else {
        // CASE SQL QUERY
        sqlTemp += `${sqlTemp ? " " : ""}${lineData}`
      }
      if (lineData.endsWith(";")) {
        entry.sql = sqlTemp
        sqlTemp = ""
        entries.push({...entry});
        entry = {}
      }
    }
  });

  return entries;
};

// Convert into CSV
const convertToCSV = (data) => {
  let csv = `TIME${splitChar}Query_time${splitChar}Lock_time${splitChar}Rows_sent${splitChar}Rows_examined${splitChar}SQL\n`;

  data.forEach((entry) => {
    csv += [entry.time,entry.query_time,entry.lock_time,entry.rows_sent,entry.rows_examined,entry.sql,"\n"].join(splitChar);
  });

  return csv;
};

// Write into file CSV
const writeCSVFile = (csvData, outputPath) => {
  console.log('Data done. Creating CSV...');
  fs.writeFileSync(outputPath, csvData, 'utf-8');
  console.log('File CSV đã được tạo thành công.');
};

// Read and handle data
const rawData = readFile(inputFilePath);
const parsedData = parseData(rawData);
const csvData = convertToCSV(parsedData);

// Write data into CSV
writeCSVFile(csvData, outputFilePath);