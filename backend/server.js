const express = require('express')
require('dotenv').config()

const port = process.env.PORT || 3000

const app = express()

app.get('/', (req, res, next) => {
  res.status(200).json({success: true, message: 'It works'})
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
