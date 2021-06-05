const path = require('path')
const http = require('http')
const express = require('express')
const app = express()
const socketio = require('socket.io')
const Filter = require('bad-words')
const server = http.createServer(app)
/* refactorig-> socketio expected to be call with the raw http server, 
when express create that BTS, we don't have access to pass it in socketio()
*/
const io = socketio(server)
const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))


/*litening a given event to occur
server (emit) => client (receive) - countUpdated
client (emit) => server (receive) - increment
*/

io.on('connection', (socket) => {
    console.log('New websocket connection')

    socket.emit('message', 'Welcome!')
    socket.broadcast.emit('message', 'A new user has joined!')

    // socket.on('sendMessage', (message, callback) => {
    //     const filter = new Filter()
    //     if (filter.isProfane(message)) {
    //         return callback('Profanity is not allowed!')
    //     }
    //     io.emit('message', message)
    //     callback()
    // })
    // socket.on('sendLocation', (coords, callback) => {
    //     io.emit('message', `https://google.com/maps?q$:${coords.latitude},${coords.longtitude}`)
    //     callback()
    // })

    socket.on('join', (room, callback) => {
        socket.join(room)
        callback()
    });
    socket.on('leave', (room, callback) => {
        socket.leave(room)
        callback()
    });
    socket.on('sendInvoiceSupplier', (invoice, callback) => {
        io.to(1).emit('invoice-retailer', invoice)
        callback()
    })
    socket.on('sendInvoiceRetailer', (invoice, callback) => {
        io.to(1).emit('invoice-supplier', invoice)
        callback()
    })
    socket.on('disconnect', () => {
        //client has already been disconnected,so use io
        io.emit('message', 'A user has left!')
    })
})
server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})