const merchAlert = {
  'name': 'Mister MV',
  'message': 'Incroyable du cul !'
}

require('dotenv').config()

const express = require('express')
const app = express()
const port = 3000
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./db.sqlite')
const axios = require('axios')
const STREAMLABS_API_BASE = 'https://www.streamlabs.com/api/v1.0'

// functions
const postMerchAlert = (token, res) => {
  axios.post(`${STREAMLABS_API_BASE}/alerts`, {
    'access_token': token,
    'type': 'merch',
    'message': `${merchAlert.name} a acheté un tee shirt`,
    'user_message': `${merchAlert.message}`
  })
    .then((response) => {
      return res.send(`<pre>${JSON.stringify(response.data.data, undefined, 4)}</pre>`)
    }).catch((error) => {
      console.log(error)
      return res.send('Érreur lors de l\'envoi de l\'alerte')
    })
}

// Routing
app.get('/', (req, res) => {
  db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS `streamlabs_auth` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `access_token` CHAR(50), `refresh_token` CHAR(50))")

    db.get("SELECT * FROM `streamlabs_auth`", (err, row) => {
      if (row) {
        // post the alert
        postMerchAlert(row.access_token, res)
      } else {
        let authorizeURL = `${STREAMLABS_API_BASE}/authorize?`

        let params = {
          'client_id': process.env.CLIENT_ID,
          'redirect_uri': process.env.REDIRECT_URI,
          'response_type': 'code',
          'scope': 'alerts.create'
        }

        // not encoding params
        authorizeURL += Object.keys(params).map(k => `${k}=${params[k]}`).join('&')

        res.send(`<a href="${authorizeURL}">Cliquer ici</a> pour autoriser cette application à poster des alertes sur votre stream`)
      }
    })
  })
})

app.get('/auth', (req, res) => {
  let code = req.query.code

  axios.post(`${STREAMLABS_API_BASE}/token?`, {
    'grant_type': 'authorization_code',
    'client_id': process.env.CLIENT_ID,
    'client_secret': process.env.CLIENT_SECRET,
    'redirect_uri': process.env.REDIRECT_URI,
    'code': code
  }).then((response) => {
    db.run("INSERT INTO `streamlabs_auth` (access_token, refresh_token) VALUES (?,?)", [response.data.access_token, response.data.refresh_token], () => {
      res.redirect('/')
    })
  }).catch((error) => {
    console.log(error)
  })
})

app.listen(port, () => console.log(`App listening on port ${port}!`))
