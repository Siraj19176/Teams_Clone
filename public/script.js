const socket = io("/")
const grid = document.getElementById('grid');

const myVideo = document.createElement('video')
var getUserMedia =navigator.getUserMedia ||navigator.webkitGetUserMedia ||navigator.mozGetUserMedia;
let videoCount = 0

myVideo.muted = true

let myVideoStream
var peer = new Peer(undefined, {
  path: '/p',
  host: '/',
  port: '443'
})

const peers = {}
const peerList={}


const constraints = {
  audio: true,
  video: true
}

const promise = getUserMedia(constraints)

promise.then(function(stream) {
  myVideoStream = stream

  helper(myVideo, stream)

  peer.on('call', function(call) {
    console.log("call aaya ")
    // setTimeout(function() {
    //   call.answer(stream)
    // }, 5000)
    //call.answer(stream)
    setTimeout(answerCall, 5000, call,stream)

    const video = document.createElement('video')
    call.on('stream', function(userVideoStream) {
      console.log("111")
      peerList[call.peer]=call.peerConnection;
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


  })

  socket.on("new-user-in-the-room", (userId) => {
    console.log("User Connected", userId);
    //ConnectNewUser(userId, stream);
    setTimeout(ConnectNewUser, 5000, userId, stream)
  });
}).catch(function(err) {
  console.log("u got an error:" + err)
})

peer.on('open', function(id) {
  console.log("peer id "+peer.id)
  socket.emit('join-call', ROOM_ID, id)
})

function answerCall(call,stream){
  call.answer(stream);
}
function ConnectNewUser(userId, stream) {
  var call = peer.call(userId, stream)
  const video = document.createElement('video')
  //console.log(stream)
  call.on('stream', function(userVideoStream) {

    console.log("222")
    helper(video, userVideoStream)
    peerList[call.peer]=call.peerConnection;
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
    peers[userId].close()
  }
  delete peerList[userId]

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
let shareScreenButton=document.getElementById("screenShare");
// shareScreenButton.addEventListener("click", function(e) {
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
//     videoTrack.onended=function(){
//       stopScreenShare()
//     }
//
//     if(Object.keys(peerList).length>0){
//       for(let x in peerList){
//         let sender=peerList[x].getSenders().find(function(s){
//           return s.track.kind==videoTrack.kind
//         })
//         sender.replaceTrack(videoTrack)
//       }
//     }
//
//   }).catch(function(error){
//     console.log("cannot share screen "+error)
//   })
//
// })
shareScreenButton.addEventListener("click", function(e){
  if(shareScreenButton.innerHTML=="Share Screen"){
    startShare()
  }
  else{
    stopScreenShare()
  }
})
function startShare() {
  shareScreenButton.innerHTML="Stop Share";
  navigator.mediaDevices.getDisplayMedia({
    video: {
      cursor: "always"
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true
    }
  }).then(function(stream){
    let videoTrack=stream.getVideoTracks()[0];
    videoTrack.onended=function(){
      stopScreenShare()
    }

    if(Object.keys(peerList).length>0){
      for(let x in peerList){
        let sender=peerList[x].getSenders().find(function(s){
          return s.track.kind==videoTrack.kind
        })
        sender.replaceTrack(videoTrack)
      }
    }

  }).catch(function(error){
    console.log("cannot share screen "+error)
  })

}
function stopScreenShare(){
  shareScreenButton.innerHTML="Share Screen";
  let videoTrack=myVideoStream.getVideoTracks()[0]
  if(Object.keys(peerList).length>0){
    for(let x in peerList){
      let sender=peerList[x].getSenders().find(function(s){
        return s.track.kind==videoTrack.kind
      })
      sender.replaceTrack(videoTrack)
    }
  }
  shareScreenButton.innerHTML="Share Screen"

}

const micBtn=document.getElementById("mic-button")
const videoBtn=document.getElementById("video-button")

micBtn.addEventListener("click",function(e){
  var span = document.querySelector('#mic-button span').innerHTML
  if(span=='Mute'){
    muteMic()
  }
  else{
    unMuteMic()
  }

})
videoBtn.addEventListener("click",function(e){
  var span = document.querySelector('#video-button span').innerHTML
  //console.log(span)
  if(span=="Stop Video"){
    stopVideo()
  }
  else{
    startVideo()
  }

})

function muteMic(){
  //console.log(myVideoStream)
  myVideoStream.getAudioTracks()[0].enabled=false;
  const temp='<i class="fas fa-microphone-slash"></i> <span>Unmute</span>'
  micBtn.innerHTML=temp;
}

function unMuteMic(){
  myVideoStream.getAudioTracks()[0].enabled=true;
  const temp='<i class="fas fa-microphone"></i> <span>Mute</span>'
  micBtn.innerHTML=temp;
}

function stopVideo(){
  myVideoStream.getVideoTracks()[0].enabled=false;
  const temp='<i class="fas fa-video-slash"></i> <span>Start Video</span>'
  videoBtn.innerHTML=temp;
}
function startVideo(){
  myVideoStream.getVideoTracks()[0].enabled=true;
  const temp='<i class="fas fa-video"></i> <span>Stop Video</span>'
  videoBtn.innerHTML=temp;
}
