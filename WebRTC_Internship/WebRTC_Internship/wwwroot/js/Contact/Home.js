var localVideo;
var remoteVideo;
var peerConnection;
var uuid;
var useruuid;

var calling = false;
var pageloaded = false;
var loadedrtc = false;

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

function getUserMediaSuccess(stream) {
    localStream = stream;
    localVideo.src = window.URL.createObjectURL(stream);
    console.log("done");
}

function loadVideos() {
    var constraints = {
        video: true,
        audio: true,
    };
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSuccess).catch(errorHandler);
    } else {
        alert('Your browser does not support getUserMedia API');
    }
    console.log("done");
}

function gotIceCandidate(event) {
    if (event.candidate != null) {
        serverConnection.send(JSON.stringify({ 'ice': event.candidate, 'uuid': uuid, 'clientuuid': useruuid }));
    }
}

function createdDescription(description) {
    peerConnection.setLocalDescription(description).then(function () {
        serverConnection.send(JSON.stringify({ 'sdp': peerConnection.localDescription, 'uuid': uuid, 'clientuuid': useruuid }));
    }).catch(errorHandler);
}

function gotRemoteStream(event) {
    console.log('got remote stream');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}

function errorHandler(error) {
    console.log(error);
}

// Taken from http://stackoverflow.com/a/105074/515584
function uuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

function receiveCall(chatuuid, hostuuid) {
    //alert()
    uuid = chatuuid;
    loadVideos()
    setTimeout(function () { start(calling); }, 2000); 
}

//CUSTOM
function start(isCaller) {
    console.log("Starting chat!");
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;
    peerConnection.onaddstream = gotRemoteStream;
    peerConnection.addStream(localStream);
    console.log("reached here");
    if (isCaller) {
        peerConnection.createOffer().then(createdDescription).catch(errorHandler);
    }
    loadedrtc = true;
}

function sendvideo(calling) {
    peerConnection.onicecandidate = gotIceCandidate;
    peerConnection.onaddstream = gotRemoteStream;
    peerConnection.addStream(localStream);
    if (calling) {
        peerConnection.createOffer().then(createdDescription).catch(errorHandler);
    }
}

function gotMessageFromServer(message) {
    var signal = JSON.parse(message.data);
    if (!peerConnection) { receiveCall(signal.uuid, signal.clientuuid); }
    if (!loadedrtc) { return;}
    // Ignore messages from ourself
    if (signal.clientuuid === useruuid) { return; }
    if (signal.uuid !== uuid) { console.log("Wrong chat send..."); return; }
    console.log("passed checkers, loading chat...");
    if (signal.sdp) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function () {
            // Only create answers in response to offers
            if (signal.sdp.type == 'offer') {
                peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
            }
        }).catch(errorHandler);
    } else if (signal.ice) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
    }
}





function pageReady() {
    useruuid = $.ajax({ type: "GET", url: "/api/contact/getcurrentuser", async: false }).responseText;
    uuid = $.ajax({ type: "GET", url: "/api/videochat/generate_chat", async: false }).responseText;
    while (useruuid === null) { }
    CONTACT_getcontacts();
    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');

    serverConnection = new WebSocket('wss://www.herreweb.nl:8443'); ///+ window.location.hostname + ':8443');
    serverConnection.onmessage = gotMessageFromServer;

    loadVideos();
    pageloaded = true;

    if (loadedrtc) {
        peerConnection.onicecandidate = gotIceCandidate;
        peerConnection.onaddstream = gotRemoteStream;
        peerConnection.addStream(localStream);
        if (calling) {
            peerConnection.createOffer().then(createdDescription).catch(errorHandler);
        }
    }
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
    var HTML = '<img src="../../images/contacts/' + contactuuid + '.jpg" class="ContactImage" onerror=this.src=' + defaultimage + ' alt="' + alt + '"  height="' + height + '" width="' + width + '" onclick="CONTACT_Call(' + calluuid + ')' + '">';
    element.innerHTML = HTML;
    var x = document.getElementById("Contacts-list-container");
    x.appendChild(element);
}

function CONTACT_Call(calluuid) {
    //loadVideos();
    calling = true;
    //setTimeout(function () { start(calling); }, 2000)
    setTimeout(function () { start(calling); }, 2000)
    setTimeout(function () { start(calling); }, 6000)
}