const path = require('path')
const http = require('http')
const express = require('express')
const app = express()
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage, generateImageMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
const { disconnect } = require('process')
const server = http.createServer(app)
const fs = require('fs');
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



    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })
        if (error) {
            return callback(error)
        }
        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longtitude}`))
        callback()
    })
    socket.on("image", async (image) => {
        const user = getUser(socket.id)
        // console.log(base64)
        var guess = image.match(/^data:image\/(jpg|png|jpeg);base64,/)[1];
        var ext = "";
        switch (guess) {
            case "png": ext = ".png"; break;
            case "jpeg": ext = ".jpg"; break;
            default: ext = ".bin"; break;
        }
        const buffer = Buffer.from(getBase64Image(image), 'base64');
        var savedFilename = "/uploads/" + randomString(10) + ext;
        fs.writeFile(publicDirectoryPath + savedFilename, buffer, 'base64', function (err) {
            if (err !== null) {
                console.log(err)
            }
            else {
                io.to(user.room).emit("receiveImage", generateImageMessage(user.username, savedFilename))
                console.log("Send image success!");
            }
        });
    });
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            //client has already been disconnected,so use io
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })
        }
    })
})
function randomString(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
function getBase64Image(imgData) {
    return imgData.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
}
server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})