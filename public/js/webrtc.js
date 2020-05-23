/** browser dependent definition are aligned to one and the same standard name **/
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition 
  || window.msSpeechRecognition || window.oSpeechRecognition;

//https://tele.trasmontano.com.br:9999/  
var config = {wssHost: 'wss://tele.trasmontano.com.br:9999/'};

var  localVideoElem   = null;
var  remoteVideoElem  = null;
var  localVideoStream = null;
var  videoCallButton  = null; 
var  endCallButton    = null;
var  peerConn         = null;

var wsc = new WebSocket(config.wssHost), peerConnCfg = {'iceServers':[{'url': 'stun:stun.services.mozilla.com'}, {'url': 'stun:stun.l.google.com:19302'}]};
    
function pageReady() 
{

  //Verifica-se web-browser é compatível com WEB_RTC
  if(navigator.getUserMedia) 
  {
    
	videoCallButton = document.getElementById("videoCallButton");
    endCallButton   = document.getElementById("endCallButton");
    localVideo      = document.getElementById('localVideo');
    remoteVideo     = document.getElementById('remoteVideo');
    
	videoCallButton.removeAttribute("disabled");
    videoCallButton.addEventListener("click", iniciaAtendimento);
    
	endCallButton.addEventListener("click", function (evt) {
	  wsc.send(JSON.stringify({"closeConnection": true }));
    });
  
  } 
  else 
  {
    alert("Atenção, seu site não suporta WebRTC!")
  }
};

function preparaAtendimento() 
{
  peerConn = new RTCPeerConnection(peerConnCfg);

  // send any ice candidates to the other peer
  peerConn.onicecandidate = onIceCandidateHandler;

  // once remote stream arrives, show it in the remote video element
  peerConn.onaddstream = onAddStreamHandler;
};

//Inicialização teleconferencia
function iniciaAtendimento() 
{
    preparaAtendimento();
    
	// get the local stream, show it in the local video element and send it
    navigator.getUserMedia({ "audio": true, "video": true }, function (stream) {
    
	localVideoStream = stream;
	
    //localVideo.src = URL.createObjectURL(localVideoStream);
	localVideo.srcObject = localVideoStream;
	
    peerConn.addStream(localVideoStream);
    createAndSendOffer();
	
  }, function(error) { console.log(error);});
};

function answerCall() 
{
    preparaAtendimento();
  
    // get the local stream, show it in the local video element and send it
    navigator.getUserMedia({ "audio": true, "video": true }, function (stream) {
  
    localVideoStream = stream;
    //localVideo.src = URL.createObjectURL(localVideoStream);
	
	localVideo.srcObject = localVideoStream;	
	
    peerConn.addStream(localVideoStream);
    
	createAndSendAnswer();
	
  }, function(error) { console.log(error);});
};

wsc.onmessage = function (evt) {
  
  var signal = null;
  
  if (!peerConn) answerCall();
    signal = JSON.parse(evt.data);
  
  if (signal.sdp) 
  {
    console.log("Received SDP from remote peer.");
	
    peerConn.setRemoteDescription(new RTCSessionDescription(signal.sdp));
  }
  else if (signal.candidate) 
  {
    console.log("Received ICECandidate from remote peer.");
    peerConn.addIceCandidate(new RTCIceCandidate(signal.candidate));
  } 
  else if (signal.closeConnection)
  {
    console.log("Received 'close call' signal from remote peer.");
    terminaAtendimento();
  }
};

function createAndSendOffer() 
{  
  peerConn.createOffer(
    
	function (offer) {
      var off = new RTCSessionDescription(offer);
      peerConn.setLocalDescription(new RTCSessionDescription(off), 
        function() {
          wsc.send(JSON.stringify({"sdp": off }));
        }, 
        function(error) { console.log(error);}
      );
    }, 
    function (error) { console.log(error);}
  
  );
  
};

function createAndSendAnswer() {
  
  peerConn.createAnswer(
  
  function (answer) {
      var ans = new RTCSessionDescription(answer);
      peerConn.setLocalDescription(ans, function() {
          wsc.send(JSON.stringify({"sdp": ans }));
        }, 
        function (error) { console.log(error);}
      );
    },
    function (error) {console.log(error);}
  );
};

function onIceCandidateHandler(evt) 
{
  if (!evt || !evt.candidate) return;
	wsc.send(JSON.stringify({"candidate": evt.candidate }));
};

function onAddStreamHandler(evt) 
{
  videoCallButton.setAttribute("disabled", true);
  endCallButton.removeAttribute("disabled"); 
  
  remoteVideo.srcObject = evt.stream;	
	
  //set remote video stream as source for remote video HTML5 element
  //remoteVideo.src = URL.createObjectURL(evt.stream);
};

function terminaAtendimento() 
{
  peerConn.close();
  peerConn = null;
  
  videoCallButton.removeAttribute("disabled");
  endCallButton.setAttribute("disabled", true);
  
  if (localVideoStream) 
  {
    localVideoStream.getTracks().forEach(function (track) {
      track.stop();
    });
	
    localVideo.src = "";
  }
  
  if (remoteVideo) remoteVideo.src = "";
  
};