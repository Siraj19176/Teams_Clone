const socket = io("/")
const grid = document.getElementById('grid');

const myVideo = document.createElement('video')

let videoCount = 0

myVideo.muted = true

let myVideoStream
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

  helper(myVideo, stream)

  peer.on('call', function(call) {
    console.log("call aaya ")
    setTimeout(function() {
      call.answer(stream)
    }, 3000)
    //call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', function(userVideoStream) {
      console.log("111")
      helper(video, userVideoStream)
    })

    call.on('close', function() {
      console.log("remove video of the peer")
      video.remove()
      videoCount = document.querySelectorAll("video").length;
      if (videoCount <= 3) {
        grid.style.gridTemplateRows = "repeat(1, 1fr)"
        grid.style.gridTemplateColumns = "repeat(" + videoCount + ", 1fr)"
      } else {
        grid.style.gridTemplateRows = "repeat(2, 1fr)"
        grid.style.gridTemplateColumns = "repeat(2, 1fr)"
      }
    })

    console.log('peer id ' + peer.id)
    peers[call.peer] = call
    console.log(peers)

  })

  socket.on("new-user-in-the-room", (userId) => {
    console.log("User Connected", userId);
    //ConnectNewUser(userId, stream);
    setTimeout(ConnectNewUser, 3000, userId, stream)
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

  call.on('close', function() {
    console.log("remove video inside connect new user")
    video.remove()
    videoCount = document.querySelectorAll("video").length;
    if (videoCount <= 3) {
      grid.style.gridTemplateRows = "repeat(1, 1fr)"
      grid.style.gridTemplateColumns = "repeat(" + videoCount + ", 1fr)"
    } else {
      grid.style.gridTemplateRows = "repeat(2, 1fr)"
      grid.style.gridTemplateColumns = "repeat(2, 1fr)"
    }
  })
  console.log("we are inside the connect new user function")
  console.log("peer id " + peer.id)
  console.log("user id " + userId)

  //peers[peer.id]=call
  peers[userId] = call
  console.log(peers)

}


function helper(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', function() {
    video.play()
  })
  //video.play();
  grid.append(video)
  videoCount = document.querySelectorAll("video").length;
  if (videoCount <= 3) {
    grid.style.gridTemplateRows = "repeat(1, 1fr)"
    grid.style.gridTemplateColumns = "repeat(" + videoCount + ", 1fr)"
  } else {
    grid.style.gridTemplateRows = "repeat(2, 1fr)"
    grid.style.gridTemplateColumns = "repeat(2, 1fr)"
  }
  console.log("videoCount " + videoCount)
}

function sendMessage() {
  let msg = document.getElementById('message').value;
  console.log(msg + " " + msg.length)
  if (msg.length > 0) {
    socket.emit("new-message", msg, ROOM_ID);

  }
  document.getElementById('message').value = '';

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


socket.on('remove-user', function(userId) {
  console.log("remove user with id " + userId)
  console.log(peers)
  if (peers[userId]) {
    peers[userId].close();
  }

})

function scroll() {
  var ref = document.querySelector('.main__chat__window')
  ref.scrollTop = ref.scrollHeight;
}

function close_window() {
  console.log("closing Meeting")
  socket.emit('disconnect-me')
  peer.destroy();
  location.href = 'https://damp-spire-56508.herokuapp.com';

}

// document.getElementById("screenShare").addEventListener("click", function(e) {
//   navigator.mediaDevices.getDisplayMedia({
//     video: {
//       cursor: "always"
//     },
//     audio: {
//       echoCancellation: true,
//       noiseSuppression: true
//     }
//   }).then(function(stream){
//     let videoTrack=stream.getVideoTracks()[0];
//     let sender=
//   }).catch(function(error){
//     console.log("cannot share screen "+error)
//   })
//
// })
