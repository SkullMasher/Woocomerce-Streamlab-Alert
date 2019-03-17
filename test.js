const fs = require('fs')
const util = require('util')
const path = require('path')

const logFile = fs.createWriteStream(path.join(__dirname, '/app.log'), { flags: 'w' })
const logStdout = process.stdout

const logToFile = d => {
  logFile.write(util.format(d) + '\n')
  logStdout.write(util.format(d) + '\n')
}

logToFile('Hello There !')
logToFile('Hello There !')
logToFile('Hello There !')
logToFile('Hello There !')
logToFile('Hello There !')
