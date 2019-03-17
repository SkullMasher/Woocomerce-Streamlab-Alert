require('dotenv').config() // Load .env file with app settings

const fs = require('fs')
const path = require('path')
const util = require('util')
const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const bodyParser = require('body-parser')
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./db.sqlite')
const axios = require('axios')
const STREAMLABS_API_BASE = 'https://www.streamlabs.com/api/v1.0'
const logFile = fs.createWriteStream(path.join(__dirname, '/app.log'), { flags: 'w' })

const logToFile = d => {
  logFile.write(util.format(d) + '\n')
  process.stdout.write(util.format(d) + '\n') // same as console.log
}

// Middlewares
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing

// functions
const postMerchAlert = (token, message, res) => {
  const postURL = `${STREAMLABS_API_BASE}/alerts`
  const postParam = {
    'access_token': token,
    'type': 'merch',
    'message': message
  }

  return axios.post(postURL, postParam)
    .then((response) => {
      return JSON.stringify(`Alerte envoyé !`)
    }).catch((error) => {
      logToFile(error)
      return JSON.stringify('Érreur lors de l\'envoi de l\'alerte')
    })
}

const authorizeApp = (res) => {
  let authorizeURL = `${STREAMLABS_API_BASE}/authorize?`
  const params = {
    'client_id': process.env.CLIENT_ID,
    'redirect_uri': process.env.REDIRECT_URI,
    'response_type': 'code',
    'scope': 'alerts.create'
  }
  // Generate authorize URL with params
  authorizeURL += Object.keys(params).map(k => `${k}=${params[k]}`).join('&')

  return res.send(`<a href="${authorizeURL}">Cliquer ici</a> pour autoriser cette application à poster des alertes sur votre stream`)
}

const saveToken = (code) => {
  const postURL = `${STREAMLABS_API_BASE}/token?`
  const postParam = {
    'grant_type': 'authorization_code',
    'client_id': process.env.CLIENT_ID,
    'client_secret': process.env.CLIENT_SECRET,
    'redirect_uri': process.env.REDIRECT_URI,
    'code': code
  }

  return axios.post(postURL, postParam)
    .then((response) => {
      const accessToken = response.data.access_token
      const refreshToken = response.data.refresh_token

      db.run('INSERT INTO `streamlabs_auth` (access_token, refresh_token) VALUES (?,?)', [accessToken, refreshToken], () => {
        return accessToken
      })
    }).catch((err) => {
      logToFile(err)
      return 'Error: Cloud not Save token'
    })
}

const getToken = () => { // To provide a function with promise functionality, simply have it return a promise
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM `streamlabs_auth`', (err, row) => {
      if (row) {
        logToFile(row.access_token)
        resolve(row.access_token)
      } else {
        reject(err)
      }
    })
  }).catch(err => console.log(err))
}
// Routing
app.get('/', (req, res) => {
  db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS `streamlabs_auth` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `access_token` CHAR(50), `refresh_token` CHAR(50))')

    db.get('SELECT * FROM `streamlabs_auth`', (err, row) => {
      if (err) {
        return logToFile(err)
      } else if (row) {
        logToFile(row.access_token)
        return res.send(`OK ! Current access_token : ${row.access_token}`)
      } else {
        return authorizeApp(res)// Ask for authorization
      }
    })
  })
})

app.get('/auth', (req, res) => {
  const code = req.query.code

  if (code) {
    return saveToken(code)
      .then(result => {
        logToFile(`App authorized with code : ${code}`)
        return res.send(`App authorized with code : ${code}`)
      })
      .catch(err => {
        logToFile(err)
        return res.send('Error: Could not save token')
      })
  } else {
    return res.redirect('/')
  }
})

app.post('/alert', (req, res) => {
  if (req.body.status === 'pending') { // pending processing completed
    const orderID = req.body.id
    const username = req.body.billing.first_name
    const message = `${username} a acheté un produit sur le magasin`

    getToken
      .then(token => {
        if (token) {
          postMerchAlert(token, message, res)
          logToFile(`Show alert for order ${orderID}`)
          return res.send(`Show alert for order ${orderID}`)
        } else {
          logToFile('/alert - App is not authorize')
          return res.send(401, `App is not authorize`)
        }
      })
      .catch(err => console.error(err))
  } else {
    return res.sendStatus(200)
  }
})

app.listen(port, () => {
  logToFile(`Woocommerce streamlabs alert started on port ${port}`)
})
