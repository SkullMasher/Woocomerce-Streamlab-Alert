const json = {
  'name': 'Mister MV',
  'message': 'Incroyable du cul'
}

const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  console.log('GET /')
  res.send('hello world')
})

app.post('/', (req, res) => {
  console.log('POST /')
})

app.listen(port, () => console.log(`App listening on port ${port}`))
