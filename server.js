const express = require('express');
const dotenv = require('dotenv');


const app = express()
dotenv.config({ path: "config/config.env" })

const PORT = process.env.PORT || 4000
app.use(express.json())  // to accept json data from frontend


app.get('/', (req, res) => {
    res.send('Api working fine')
})
const server = app.listen(PORT, console.log(`server is listening on port ${PORT}`));

const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3000",
    }
})

const userSocketMap = {};
function getAllConnectedClients(roomId) {
    // 
        // console.log( `io.sockets.adapter.rooms` ,  io.sockets.adapter.rooms);
        // console.log( `rohitsockets by roomId::: ${roomId}` ,  io.sockets.adapter.rooms.get(roomId));
        // console.log( `rohitsocketsTYPE by roomId::: ${roomId}` ,  typeof(io.sockets.adapter.rooms.get(roomId)));
        // console.log( `rohitsocketsARRAY by roomId::: ${roomId}` ,  Array.from(io.sockets.adapter.rooms.get(roomId)));
    //
 
    Map
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        } 
    );
}   

io.on("connection", (socket) => { // run 2 times in start due to io.on
    console.log(`socket connected socketId:  ${socket.id}`); // run 2 times in start due to io.on
    socket.on( "join" , ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        console.log("clients" , clients);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit("joined", {
                clients,
                username,
                socketId: socket.id,
            }); 
        });
    }); 

    socket.on( "code-change", ({ roomId, code }) => {
        socket.in(roomId).emit("code-change" , { code }); // socket.in ka matlab h jitne bhi clients mere room ke andar  un sab ko bhejo sirf mujhko chod ke . 
        // io.to(roomId).emit("code-change" , { code }); //  room ke andar emit karne se , us room ke sare clients ko chala jayega / mujhe bhi chla jayega kyuki m bhi us room ke andar ho :: io.to ka matlab h jitne bhi clients us room ke andar h un sab ko bhejo aur agar m bhi ho to mujhe bhi bhejo

    });

    socket.on( "sync-code", ({ socketId, code }) => {   
        io.to(socketId).emit( "code-change", { code });  
    });

    // "disconnecting" , "disconnect" - pre-defined event h // but "disconnected" ek custom event h jo hum khud banate h na ki ek pre-defined event
    // "disconnecting" ek pre-defined event h - like "disconnect"
    socket.on('disconnecting', () => {   // don't use "disconnect" event nhi to jo bhi awailable rooms h vo nhi milenge. / "disconnecting" event hame completely socket disconnect hone se pehle mil jata h // when someone close the browser or goes to a different page tab socket-connection jo h hamara vo server p "disconnecting" event bhej deta h. [ disconnecting :: matlab client disconnect kar kar raha h]
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            // socket.in(roomID) - matlab - socket bhaiya us roomId wale room ke andar emit kar rahe h // aur hamko future m ye check karna h ki kya different socket jo us roomid ke room ka hi nhi h , vo bhi emit kar sakta us room ke andar ke sabhi socket ko ya sirf room ke andar ka socket hi kewal us room ke ke sabhi socket ko emit karega
            socket.in(roomId).emit( "disconnected", {  // disconnected is custom event :: 
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();  // to get out of room 
    });
})


  