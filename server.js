const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('message', (msg) => {
        socket.broadcast.emit('message', msg);
    });

    socket.on('seen', (msg) => {
        socket.broadcast.emit('seen', msg);
    });

    socket.on('edit-message', (msg) => {
        io.emit('edit-message', msg);
    });

    socket.on('delete-message', (msg) => {
        io.emit('delete-message', msg);
    });

    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
    });
});

http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
})