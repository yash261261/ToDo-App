const
    express = require('express'),
    path = require('path')

const
    app = express(),
    server = require('http').Server(app)

app.use(express.static(path.join(__dirname, '..', '/client')))
const db = require('./db')
require('./socket')(server, db)


server.listen(8080)

