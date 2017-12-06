var localVideo;
var remoteVideo;
var peerConnection;
var serverConnection;

var isCaller = false;
var loaded = false;
var uuid;
var clientuuid;
var answered = false;

var peerConnectionConfig = {
    'iceServers': [
        { 'urls': 'stun:stun.services.mozilla.com' },
        { 'urls': 'stun:stun.l.google.com:19302' },
        { 'urls': 'stun:stun.l.google.com:19302' },
        { 'urls': 'stun:stun1.l.google.com:19302' },
        {
            'urls': 'turn:numb.viagenie.ca:3478',
            'credential': 'm8b56b5',
            'username': 'e.herrewijnen@gmail.com'
        },
    ]
};

function VIDEO_Connection() {
    serverConnection = new WebSocket('wss://www.herreweb.nl:8443');  //www.herreweb.nl:8443');// + window.location.hostname + ':8443');
    serverConnection.onmessage = gotMessageFromServer;
}

//After sending call or answered call
function VIDEO_Setup() {
    console.log("Chat UUID: ", uuid);
    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');
    var constraints = {
        video: true,
        audio: true,
    };
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSuccess).catch(errorHandler);
    } else {
        alert('Your browser does not support getuserMedia API, which is needed to send and receive calls.');
    }

}

function getUserMediaSuccess(stream) {
    loaded = true;
    localStream = stream;
    localVideo.src = window.URL.createObjectURL(stream);
    start(isCaller);
}

function CONTACT_Receivecall(caller, chatid) {
    if (confirm("Receiving call from ", caller, ". Do you wan to answer the call?")) {
        uuid = chatid;
        VIDEO_Setup();
        setTimeout(function () { start(isCaller) }, 4000);
    }
    else {
        console.log("denied call");
    }
}

function start(isCaller) {
    if (!loaded) { console.log("not yet loaded..."); }
    console.log("Starting chat!");
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;
    peerConnection.onaddstream = gotRemoteStream;
    peerConnection.addStream(localStream);
    console.log("reached end of setup isCaller=", isCaller);
    if (isCaller) {
        console.log("creating and sending offer");
        peerConnection.createOffer().then(createdDescription).catch(errorHandler);
    }
}

function getstate() {
    console.log(peerConnection.iceConnectionState);
}

function gotMessageFromServer(message) {
    var signal = JSON.parse(message.data);
    console.log("Receiving call: ", signal.clientuuid);
    if (!peerConnection && !answered) { CONTACT_Receivecall(signal.clientuuid, signal.uuid); answered = true; } //start(false); }
    if (!loaded) { return; }
    // Ignore messages from ourself
    if (signal.clientuuid === clientuuid) { return; }
    if (signal.uuid !== uuid) { console.log("Wrong chat send..."); console.log(signal.uuid, "::", uuid); return; }
    console.log("Starting chat with: remote id=", signal.clientuuid);
    if (signal.sdp) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function () {
            if (signal.sdp.type === 'offer') {
                peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
            }
        }).catch(errorHandler);
    } else if (signal.ice) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
    }
}

function gotIceCandidate(event) {
    if (event.candidate != null) {
        console.log(uuid);
        serverConnection.send(JSON.stringify({ 'ice': event.candidate, 'uuid': uuid, 'clientuuid': clientuuid }));
    }
}

function createdDescription(description) {
    peerConnection.setLocalDescription(description).then(function () {
        serverConnection.send(JSON.stringify({ 'sdp': peerConnection.localDescription, 'uuid': uuid, 'clientuuid': clientuuid }));
    }).catch(errorHandler);
}

function gotRemoteStream(event) {
    console.log('got remote stream');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}

function errorHandler(error) {
    console.log("Error: ", error);
}

//Got this function from stackoverflow: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/21963136
function createuuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

function pageReady() {
    clientuuid = $.ajax({ type: "GET", url: "/api/contact/getcurrentuser", async: false }).responseText;
    while (clientuuid === null) {
    }
    CONTACT_getcontacts();
    VIDEO_Connection();
    serverConnection.onmessage = gotMessageFromServer;
    if (loaded) {
        peerConnection.onicecandidate = gotIceCandidate;
        peerConnection.onaddstream = gotRemoteStream;
        peerConnection.addStream(localStream);
    }
    //VIDEO_Setup();
}

$(document).ready(function () {
    pageReady();
});

//Sends ajax call to get contacts from currently logged in user. Backend checks user config.
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
        if (contacts[i] != "") {
            data = contacts[i].split(";");
            var id = data[1]; //ID of user
            CONTACT_CreateImageContact(id, data[0], 276, 180);
        }
    }
}

//Obscure function for creating clickable picture elements.
function CONTACT_CreateImageContact(contactuuid, alt, height, width) {
    var element = document.createElement("div");
    element.id = contactuuid;
    var calluuid = "'" + contactuuid + "'";
    var defaultimage = '"../../images/contacts/default.jpg"';
    var HTML = '<img src="../../images/contacts/' + contactuuid + '.jpg" class="ContactImage" onerror=this.src=' + defaultimage + ' alt="' + alt + '"  height="' + height + '" width="' + width + '" onclick="VIDEOCHAT_Call(' + calluuid + ')' + '">';
    element.innerHTML = HTML;
    var x = document.getElementById("Contacts-list-container");
    x.appendChild(element);
}

function VIDEOCHAT_Call(contactuuid) {
    uuid = $.ajax({ type: "GET", url: "/api/videochat/generate_chat", async: false }).responseText;
    isCaller = true;
    setTimeout(function () {
        VIDEO_Setup();
    }, 1000)
    console.log("Contact uuid: ", contactuuid);
    setTimeout(function () { start(isCaller); }, 6000);
}