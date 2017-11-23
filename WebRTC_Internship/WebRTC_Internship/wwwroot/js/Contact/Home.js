var localVideo;
var remoteVideo;
var peerConnection;
var uuid;
var clientuuid;

var peerConnectionConfig = {
    'iceServers': [
        { 'urls': 'stun:stun.services.mozilla.com' },
        { 'urls': 'stun:stun.l.google.com:19302' },
    ]
};

function CreateChat() {
    window.location.href = window.location.hostname + "/api/videochat/startchat";
}

function VIDEO_Connection() {
    console.log("Location :: " + window.location.hostname);
    serverConnection = new WebSocket('wss://' + window.location.hostname + ':8443');
    console.log("Connected to server");
    serverConnection.onmessage = gotMessageFromServer;
}

//After sending call or answered call
function VIDEO_Setup() {
    //clientuuid = uuid();
    //uuid = window.location.href.split('/').pop();
    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');
    var constraints = {
        video: true,
        audio: true,
    };
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSuccess).catch(errorHandler);
    } else {
        alert('Your browser does not support getUserMedia API');
    }
}

function getUserMediaSuccess(stream) {
    localStream = stream;
    localVideo.src = window.URL.createObjectURL(stream);
}

function start(isCaller) {
    console.log("Starting chat!");
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;
    var state = peerConnection.iceConnectionState
    peerConnection.onaddstream = gotRemoteStream;
    peerConnection.oniceconnectionstatechange = function () {
        console.log('ICE State: ', state);
    }
    peerConnection.addStream(localStream);
    console.log("reached here");
    if (isCaller) {
        peerConnection.createOffer().then(createdDescription).catch(errorHandler);
    }
}

function getstate() {
    console.log(peerConnection.iceConnectionState);
}

function gotMessageFromServer(message) {
    if (!peerConnection) start(false);
    var signal = JSON.parse(message.data);
    // Ignore messages from ourself
    if (signal.clientuuid === clientuuid) return;
    if (signal.uuid !== uuid) { console.log("Wrong chat send..."); return; }

    console.log("reached the other side...");

    if (signal.sdp) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function () {
            // Only create answers in response to offers
            if (signal.sdp.type === 'offer') {
                peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
            }
        }).catch(errorHandler);
    } else if (signal.ice) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
    }
}

function gotIceCandidate(event) {
    if (event.candidate !== null) {
        serverConnection.send(JSON.stringify({ 'ice': event.candidate, 'uuid': uuid, 'clientuuid': this.clientuuid }));
    }
}

function createdDescription(description) {
    peerConnection.setLocalDescription(description).then(function () {
        serverConnection.send(JSON.stringify({ 'sdp': peerConnection.localDescription, 'uuid': uuid, 'clientuuid': this.clientuuid }));
    }).catch(errorHandler);
}

function gotRemoteStream(event) {
    console.log('got remote stream');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}

function errorHandler(error) {
    console.log(error);
}

//Got this function from stackoverflow: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/21963136
function createuuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

function pageReady() {
    this.clientuuid = $.ajax({ type: "GET", url: "/api/contact/getcurrentuser", async: false }).responseText;
    console.log(this.uuid);
    CONTACT_getcontacts();
    VIDEO_Setup();
    //Video_setup();
}

$(document).ready(function () {
    pageReady();
});

function CONTACT_getcontacts() {
    $.get("/api/contact/getcontacts", function () {
    })
        .done(function (data) {
            CONTACT_loadcontacts(data)
        })
        .fail(function () {
            alert("error");
        })
        .always(function () {
        });
}

function CONTACT_loadcontacts(data) {
    var contacts = data.split("|");
    for (var i = 0; i < contacts.length; i++) {
        if (contacts[i] !== "") {
            data = contacts[i].split(";");
            var id = data[1]; //ID of user
            CONTACT_CreateImageObject(id, data[0], 276, 180);
        }
    }
}


//Obscure function for creating clickable picture elements.
function CONTACT_CreateImageObject(uuid, alt, height, width) {
    var element = document.createElement("div");
    element.id = uuid;
    var calluuid = "'" + uuid + "'";
    var defaultimage = '"../../images/contacts/default.jpg"';
    var HTML = '<img src="../../images/contacts/' + uuid + '.jpg" onerror=this.src=' + defaultimage + ' alt="' + alt + '" height="' + height + '" width="' + width + '" onclick="VIDEOCHAT_Call(' + calluuid + ')' + '">';
    element.innerHTML = HTML;
    var x = document.getElementById("Contacts-list-container");
    x.appendChild(element);
}

function VIDEOCHAT_Call(uuid) {
    console.log(uuid);
}