const express=require('express')
const app = express()
const http= require("http")
const server = http.Server(app)
const {v4: randomId}=require('uuid')
//const { ExpressPeerServer } = require('peer');
// import { ExpressPeerServer } from 'peer';
var ExpressPeerServer = require('peer').ExpressPeerServer;
const peerServer = ExpressPeerServer(server, {
  debug: true
});
const io = require('socket.io')(server)
const bodyParser=require('body-parser')

let agendas=[]
app.set("view engine",'ejs')

app.use(express.static('public'))

app.use('/p',peerServer)

app.use(bodyParser.urlencoded({extended:true}))


app.get('/:r',function(req,res){
  //console.log(agendas)
  res.render('room',{roomId:req.params.r,newActivity:agendas})
})

app.get('/', function (req, res){
  agendas=[]
  var today=new Date();
  var options = {
    weekday:"long",
    day:"numeric",
    month:"long"
  };

  var date=today.toLocaleDateString("en-Us",options)
  res.render('agenda',{kindOfDay:date,newActivity:agendas})

})

app.post('/agenda', function (req, res){
  //console.log(req)
  agendas.push(req.body.newActivity)
  //res.redirect('/')
  var today=new Date();
  var options = {
    weekday:"long",
    day:"numeric",
    month:"long"
  };

  var date=today.toLocaleDateString("en-Us",options)
  res.render('agenda',{kindOfDay:date,newActivity:agendas})
})

app.post('/joinRoom',function(req, res){
  const tuid=randomId()
  console.log("id of room="+tuid)
  res.redirect('/'+tuid)
})


io.on('connection',function(socket){
  socket.on('join-call',function(room,userId){
    console.log(userId+" user joined the room "+room)
    socket.join(room)
    //console.log(socket.rooms)
    socket.broadcast.to(room).emit('new-user-in-the-room', userId)

    socket.on('disconnect',function(reason){
      console.log('user disconnected with id '+userId)
      socket.broadcast.to(room).emit('remove-user', userId)
    })
    socket.on('disconnect-me',function(){
      socket.disconnect()
    })


  })

  socket.on('new-message',function(msg,ROOM_ID){
    //console.log(msg)
    //io.sockets.emit("message",msg)
    io.to(ROOM_ID).emit("message",msg)
  })




})

server.listen(process.env.PORT || 3000,function(){
  console.log("Server Running on 3000")
})
