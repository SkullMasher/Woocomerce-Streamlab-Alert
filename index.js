require('dotenv').config() // Load .env file with app settings

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./db.sqlite')
const axios = require('axios')
const STREAMLABS_API_BASE = 'https://www.streamlabs.com/api/v1.0'

// Middlewares
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing
app.use((req, res, next) => { // redirect if there's a trailing slash in url
  const test = /\?[^]*\//.test(req.url)
  if (req.url.substr(-1) === '/' && req.url.length > 1 && !test) {
    res.redirect(301, req.url.slice(0, -1))
  } else {
    next()
  }
})

// functions
const postMerchAlert = (token, message, userMessage, res) => {
  axios.post(`${STREAMLABS_API_BASE}/alerts`, {
    'access_token': token,
    'type': 'merch',
    'message': message,
    'user_message': userMessage
  })
    .then((response) => {
      // return res.send(`<pre>${JSON.stringify(response.data.data, undefined, 4)}</pre>`)
      return res.send(`Alerte envoyé !`)
    }).catch((error) => {
      console.log(error)
      return res.send('Érreur lors de l\'envoi de l\'alerte')
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

  res.send(`<a href="${authorizeURL}">Cliquer ici</a> pour autoriser cette application à poster des alertes sur votre stream`)
}

const saveToken = (code, res) => {
  axios.post(`${STREAMLABS_API_BASE}/token?`, {
    'grant_type': 'authorization_code',
    'client_id': process.env.CLIENT_ID,
    'client_secret': process.env.CLIENT_SECRET,
    'redirect_uri': process.env.REDIRECT_URI,
    'code': code
  }).then((response) => {
    db.run('INSERT INTO `streamlabs_auth` (access_token, refresh_token) VALUES (?,?)', [response.data.access_token, response.data.refresh_token], () => {
      return res.redirect('/')
    })
  }).catch((error) => {
    console.error(error)
  })
}

const getToken = new Promise((resolve, reject) => {
  db.get('SELECT * FROM `streamlabs_auth`', (err, row) => {
    if (err) {
      reject(err)
    }

    if (row) {
      resolve(row.access_token)
    } else {
      reject(new Error('db table seems to be empty'))
    }
  })
})

// Routing
app.get('/', (req, res) => {
  db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS `streamlabs_auth` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `access_token` CHAR(50), `refresh_token` CHAR(50))')

    db.get('SELECT * FROM `streamlabs_auth`', (err, row) => {
      if (row) {
        res.send(`OK ! Vous pouvez maintenant fermer cette page`)
      } else {
        authorizeApp(res)// Ask for authorization
      }

      if (err) {
        console.error(err)
      }
    })
  })
})

app.get('/auth', (req, res) => {
  const code = req.query.code
  if (code) {
    console.log(`App authorized with code : ${code}`)
    return saveToken(code, res)
  } else {
    console.log(`Authorization failed`)
    return res.redirect('/')
  }
})

app.post('/alert', (req, res) => {
  if (req.body.status === 'completed') {
    const orderID = req.body.id
    const message = `MisterMV a acheté sur le magasin`
    const userMessage = `Le message personalisé de l'utilisateur`

    getToken.then(token => {
      if (token) {
        postMerchAlert(token, message, userMessage, res)
        console.log(`Show alert for order ${orderID}`)
        return res.send(JSON.stringify(`Show alert for order ${orderID}`))
      } else {
        console.log(`App is not authorize`)
        res.send(JSON.stringify(`App is not authorize`))
      }
    }).catch(err => console.error(err))
  }
})

app.listen(process.env.PORT, () => {
  console.log(`Woocommerce streamlabs alert listening on port ${process.env.PORT}!`)
})
