const socket = io("/")
const grid = document.getElementById('grid');

const myVideo = document.createElement('video')

//const myVideo2=document.createElement('video')
myVideo.muted = true
//myVideo2.muted=true
let myVideoStream;
var peer = new Peer(undefined, {
  path: '/p',
  host: '/',
  port: '443'
})

const peers = {}

const constraints = {
  audio: true,
  video: true
}

const promise = navigator.mediaDevices.getUserMedia(constraints)

promise.then(function(stream) {
  myVideoStream = stream
  //addVideoStream(myVideo, stream)
  //myVideo.srcObject=stream;
  // myVideo.addEventListener('loadedmetadata', function(){
  //   myVideo.play();
  // })
  // myVideo.play()
  // grid.append(myVideo)
  //
  // myVideo2.srcObject=stream;
  // myVideo2.play();
  // grid.append(myVideo2);

  helper(myVideo, stream)
  peer.on('call', function(call) {
    console.log("call aaya ")
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', function(userVideoStream) {
      console.log("111")
      helper(video, userVideoStream)
    })

    call.on('close', function(){
      console.log("remove video of the peer")
      video.remove()
    })

    console.log('peer id ' +peer.id)
    peers[call.peer]=call
    console.log(peers)

  })

  socket.on("new-user-in-the-room", (userId) => {
    console.log("User Connected", userId);
    //ConnectNewUser(userId, stream);
    setTimeout(ConnectNewUser, 1000, userId, stream)
  });
}).catch(function(err) {
  console.log("u got an error:" + err)
})

peer.on('open', function(id) {
  console.log(id)
  socket.emit('join-call', ROOM_ID, id)
})


function ConnectNewUser(userId, stream) {
  var call = peer.call(userId, stream)
  const video = document.createElement('video')
  //console.log(stream)
  call.on('stream', function(userVideoStream) {
    console.log("222")
    helper(video, userVideoStream)
  })

  call.on('close', function(){
    console.log("remov video inside coonect new user")
    video.remove()
  })
  console.log("we are inside the connect new user function")
  console.log("peer id "+peer.id)
  console.log("user id "+userId)

  //peers[peer.id]=call
  peers[userId]=call
  console.log(peers)

}


function helper(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', function() {
    video.play();
  })
  //video.play();
  grid.append(video)
}

function sendMessage() {
  let msg = document.getElementById('message').value;
  console.log(msg+" "+msg.length)
  if (msg.length > 0) {
    socket.emit("new-message", msg,ROOM_ID);

  }
  document.getElementById('message').value='';

}

socket.on("message", function(message) {
  console.log(message)
  var ref = document.getElementById('m-list')
  var node = document.createElement("LI");
  var textnode = document.createTextNode(message);
  node.appendChild(textnode);
  ref.appendChild(node);
  // document.getElementById('message').value='';
  scroll()

})


socket.on('remove-user',function(userId){
  console.log("remove user with id "+userId)
  console.log(peers)
  if(peers[userId]){
    peers[userId].close();
  }

})
function scroll(){
  var ref=document.querySelector('.main__chat__window')
  ref.scrollTop = ref.scrollHeight;
}

function close_window(){
  console.log("closing Meeting")
  socket.emit('disconnect-me')
  peer.destroy();
  location.href = 'https://damp-spire-56508.herokuapp.com';

}
