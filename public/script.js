const socket = io("/");
const myVideo = document.createElement("video");
const videoGrid = document.getElementById("video-grid");
myVideo.muted = true; // Fixing the mute issue

var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});

let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream); // Fix: Calling the correct function
    });
  });

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id); // Fix: Removed duplicate emit
});

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
};

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};

let text = $("input");

$("html").keydown((e) => {
  if (e.which == 13 && text.val().length !== 0) {
    console.log(text.val());
    socket.emit("message", text.val());
    text.val("");
  }
});

socket.on("createMessage", (message) => {
  $("ul").append(`<li class='message'> <b>User</b> <br/> ${message}</li>`);

  scrollBtn();
});

const scrollBtn = () => {
  let div = $(".main__chat_window");
  div.scrollTop(div.prop("scrollHeight"));
};

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteBtn();
  } else {
    setMuteBtn();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const setMuteBtn = () => {
  const html = `<i class="fa-solid fa-microphone"></i>
              <span>Mute</span>`;

  document.querySelector(".main__mute_button").innerHTML = html;
};

const setUnmuteBtn = () => {
  const html = `<i class="unmute fa-solid fa-microphone-slash"></i>
             <span>Unmute</span>`;

  document.querySelector(".main__mute_button").innerHTML = html;
};

const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;

  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const setStopVideo = () => {
  const html = `<i class=" fa-solid fa-video"></i>
              <span>Stop Video</span>`;
  document.querySelector(".main__video_button").innerHTML = html;
};

const setPlayVideo = () => {
  const html = `<i class="stop fa-solid fa-video-slash"></i>
             <span>Play Video</span>`;
  document.querySelector(".main__video_button").innerHTML = html;
};

const leaveMeeting = () => {
  if (confirm("Are you sure you want to leave the meeting?")) {
    // Close peer connection
    peer.destroy();
    
    // Notify other users
    socket.emit('user-disconnected', peer.id);
    
    // Stop all media streams
    if (myVideoStream) {
      myVideoStream.getTracks().forEach(track => track.stop());
    }
    
    // Redirect to homepage or close window
    window.location.href = "/";
    
    // Optional: Clean up video grid
    const videoGrid = document.getElementById('video-grid');
    while (videoGrid.firstChild) {
      videoGrid.removeChild(videoGrid.firstChild);
    }
  }
};
