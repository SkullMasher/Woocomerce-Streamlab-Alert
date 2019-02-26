const merchAlert = {
  'name': 'Mister MV',
  'message': 'Incroyable du cul'
}

const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  console.log('GET /')
  res.send('<a href="https://streamlabs.com/api/v1.0/authorize?response_type=code&client_id=AvS0kRZTc97kcUveOj1AzuhRSW1Z7vUGa8BLtDYy&redirect_uri=https%3A%2F%2Fskullmasher.io%2Fstreamlabs&scope=alerts.create">Cliquer ici</a> pour autoriser cette application à poster des alertes sur votre steam')
})

app.post('/', (req, res) => {
  console.log('POST /')
})

app.listen(port, () => console.log(`App listening on port ${port}`))
