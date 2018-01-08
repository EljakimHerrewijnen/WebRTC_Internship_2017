var localVideo;
var remoteVideo;
var peerConnection;
var uuid; //chat uuid
var useruuid; //Current user uuid
var onlineusers;

var calling = false;
var pageloaded = false;
var loadedrtc = false;
var callaccepted = false;
var answered = false;
var remoteclient = 0;
var remotecallaccept = false;

var peerConnectionConfig = {
    'iceServers': [
        { 'urls': 'stun:stun.services.mozilla.com' },
        { 'urls': 'stun:stun.l.google.com:19302' },
        // { 'urls': 'turn:turn:52.232.119.53:3478', 'credential': 'yourpassword', 'username':'youruser' },
        { 'urls': 'stun:stun1.l.google.com:19302' },
        {
            'urls': 'turn:numb.viagenie.ca:3478',
            'credential': 'm8b56b5',
            'username': 'e.herrewijnen@gmail.com'
        },
    ]
};


//Internals for RTC Peer and VIDEO chat
function getUserMediaSuccess(stream) {
    localStream = stream;
    localVideo.src = window.URL.createObjectURL(stream);
}

function loadVideos() {
    var constraints = {
        video: true,
        //audio: true,
    };
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSuccess).catch(errorHandler);
    } else {
        alert('Your browser does not support getUserMedia API');
    }
}

function gotIceCandidate(event) {
    if (event.candidate !== null) {
        //console.log("Remoteclient ==", remoteclient)
        serverConnection.send(JSON.stringify({ 'ice': event.candidate, 'uuid': uuid, 'clientuuid': useruuid, 'remoteclient': remoteclient }));
    }
}

function createdDescription(description) {
    peerConnection.setLocalDescription(description).then(function () {
        serverConnection.send(JSON.stringify({ 'sdp': peerConnection.localDescription, 'uuid': uuid, 'clientuuid': useruuid, 'remoteclient': remoteclient }));
    }).catch(errorHandler);
}

function checkonlineusers() {
    serverConnection.send(JSON.stringify({ 'sdp': 'getonline', 'uuid': 0, 'clientuuid': useruuid, 'remoteclient': remoteclient }))
}

function gotRemoteStream(event) {
    console.log('got remote stream!!!!!!!!!!!');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}

function errorHandler(error) {
    console.log(error);
}

function gotMessageFromServer(message) {
    console.log("got message from server");
    var signal = JSON.parse(message.data);
    if (signal.function === "getonline") {
        onlineusers = signal.userlist;
        CONTACT_getcontacts();
        return;
    }
    console.log("reached here")
    //if (!peerConnection) { receiveCall(signal.uuid, signal.clientuuid); }
    // Ignore messages from ourself
    // if (signal.clientuuid === useruuid) { return; }
    //if (signal.uuid !== uuid) { console.log("Wrong chat send..."); return; }
    if (!peerConnection && !answered) { receiveCall(signal.uuid, signal.clientuuid); }
    // if (!answered) { return; }
    console.log("passed checkers, loading chat...");
    if (signal.sdp || signal.function === "sdp") {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function () {
            // Only create answers in response to offers
            if (signal.sdp.type == 'offer') {
                console.log("OFFFFEEEER")
                peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
            }
        }).catch(errorHandler);
    } else if (signal.ice) {
        console.log("IIICEEE")
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
    }
    else {
        console.log("Something else");
    }
}


//Toolset
// Taken from http://stackoverflow.com/a/105074/515584
function uuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

function stoptracks() {
    localStream.getTracks().forEach(function (track) {
        track.stop();
    })
}

function resetbody() {
    try {
        stoptracks();
    }
    catch (err) { };
    var element = document.getElementById("Contacts-list-container");
    element.innerHTML = "";
}

function pageReady() {
    serverConnection = new WebSocket('wss://www.herreweb.nl:8443');        //wss://www.herreweb.nl:8443'); ///+ window.location.hostname + ':8443');
    serverConnection.onmessage = gotMessageFromServer;
    //CONTACT_CheckonlineUsers(contactslist)
    useruuid = $.ajax({ type: "GET", url: "/api/contact/getcurrentuser", async: false }).responseText;
    uuid = $.ajax({ type: "GET", url: "/api/videochat/generate_chat", async: false }).responseText;
    while (useruuid === null) { }
    setTimeout(function () { checkonlineusers(); }, 750);
    pageloaded = true;
}

$(document).ready(function () {
    pageReady();
});


//VIDEO Custom calls
function init_videochat() {
    var HTML = '<video id="localVideo" autoplay muted style="width: 20%;"></video> <video id= "remoteVideo" autoplay style= "width:20%;" ></video > <button id="CreateChat" onclick="start(true)">Create Chat!</button>';
    var element = document.getElementById("Contacts-list-container");
    element.innerHTML = HTML;
    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');
    loadVideos();
    setTimeout(function () { start(calling); }, 2000)
}



var popupactive = false;
function receiveCall(chatuuid, hostuuid) {
    remoteclient = hostuuid;
    console.log("Receiving call from: ", hostuuid);
    //Popup for accepting or rejecting calls
    if (!answered) {
        Incommingcall();
    }
    uuid = chatuuid;
    var modal = document.getElementById('myModal');
    function check() {
        if (answered) {
            console.log("Answered call")
            modal.style.display = "none";
            return;
        }
        else {
            setTimeout(function () { check(); }, 300)
        }
    }
    if (!popupactive) {
        check();
        //popupactive = false;
    }
    if (!callaccepted) {
        return;
    }
    setTimeout(function () { init_videochat() }, 2000);
    //setTimeout(function () { start(calling); }, 2000); 
}

function start(isCaller) {
    console.log("Starting chat!");
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;
    peerConnection.onaddstream = gotRemoteStream;
    peerConnection.addStream(localStream);
    if (isCaller) {
        console.log("iscaller == ", calling);
        peerConnection.createOffer().then(createdDescription).catch(errorHandler);
        //setTimeout(function () { peerConnection.stop(); }, 2000)
    }
    loadedrtc = true;
}


//Contact functions
function loadcontactspage() {
    CONTACT_getcontacts();
}

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

function CONTACT_Checkonline(remoteuserid) {
    console.log(onlineusers);
    var temp = onlineusers.split(";");
    for (var i = 0; i < temp.length; i++) {
        console.log("Checking current user: ", temp[i])
        if (temp[i] === remoteuserid) {
            return true;
        }
    }
    return false;
}

function CONTACT_loadcontacts(data) {
    var contacts = data.split("|");
    for (var i = 0; i < contacts.length; i++) {
        if (contacts[i] != "") {
            data = contacts[i].split(";");
            var id = data[1]; //ID of user
            var online = CONTACT_Checkonline(id);
            CONTACT_CreateImageContact(id, data[0], 276, 200, data[0], data[2], online);
        }
    }
}

//Obscure function for creating clickable picture elements.
var createdparagraph = false;

function CONTACT_CreateImageContact(contactuuid, alt, height, width, contactname, status, online) {
    var element = document.createElement("div");
    element.id = contactuuid;
    var calluuid = "'" + contactuuid + "'";
    var defaultimage = '"../../images/contacts/default.jpg"';
    var HTML = "";
    var x = document.getElementById("Contacts-list-container");
    if (status === "Approved") {
        HTML += '<div id="Contact_imagediv"><img id="CONTACT_image" src="../../images/contacts/' + contactuuid + '.jpg" class="ContactImage" onerror=this.src=' + defaultimage + ' alt="' + alt + '"  height="' + height + '" width="' + width + '" onclick="CONTACT_Call(' + calluuid + ')' + '">';
        if (online) {
            var textarea = '<textarea id="CONTACT_textarea"> ' + contactname + ' is online</textarea></div>';
        }
        else {
            var textarea = '<textarea id="CONTACT_textarea"> ' + contactname + ' is offline</textarea></div>';
        }
        HTML += textarea;
    }
    else if (status === "Submitted") {
        x = document.getElementById("Contacts-list-container2");
        if (!createdparagraph) {
            createdparagraph = true;
            HTML += '<div><h2>Contact Invites</h2></div>'
        }
        HTML += '<div id="SEARCH_imagediv"><img id="CONTACT_image" src="../../images/contacts/' + contactuuid + '.jpg" class="ContactImage" onerror=this.src=' + defaultimage + ' alt="' + alt + '" height="' + height + '" width="' + width + '"onclick="CONTACT_Call(' + calluuid + ')' + '"><textarea id="CONTACT_textarea">' + contactname + '</textarea><button type="button" id="CONTACT_acceptbutton" onclick="CONTACT_acceptinvite(true,' + calluuid + ')">Accept</button><button type="button" id="CONTACT_rejectbutton" onclick="CONTACT_acceptinvite(false,' + calluuid + ')">Reject</button></div>'
    }
    element.innerHTML = HTML;
    x.appendChild(element);
}

function CONTACT_acceptinvite(accept, contactuuid) {
    $.ajax({
        type: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        url: "/api/contact/invite",
        data: JSON.stringify({ contactuuid: contactuuid, accept: accept }),
        accept: 'application/json'
    })
}

function CONTACT_UploadImage() {
    var fileUpload = $("#FileUpload1").get(0);
}

function CONTACT_Call(calluuid) {
    remoteclient = calluuid;
    answered = true;
    calling = true;
    init_videochat();
    // function checkcall(){
    // if(remotecallaccept){
    // console.log("remotecallaccept");
    // return;
    // }
    // else{
    // console.log("sending call...")
    // setTimeout(function () { start(calling) }, 3000);
    // setTimeout(function () { checkcall() }, 3000);
    // }
    // }
    // checkcall();
    setTimeout(function () { start(calling) }, 4000);
    //  setTimeout(function () { start(calling) }, 8000);
}

function CONTACT_sendinvite(username) {
    $.ajax({ type: "GET", url: "/api/contact/addcontact/" + username, async: false });
}

//Search users
function SEARCH_view() {
    resetbody();
    var HTML = '<div id="SEARCH_contact"><input type="text" id="SEARCH_input" placeholder="Search.."><button id="SEARCH_button" onclick="SEARCH_action()">Search</button></div>';
    var element = document.getElementById("Contacts-list-container");
    element.innerHTML = HTML;
}

function SEARCH_action() {
    var element2 = document.getElementById("SEARCH_input").value;
    var returndata = $.ajax({ type: "GET", url: "/api/contact/search/" + element2, async: false }).responseText;
    SEARCH_results(returndata);
}

function SEARCH_loadcontacts(contactuuid, alt, height, width, contactname) {
    if (contactuuid === useruuid) {
        return;
    }
    var element = document.createElement("div");
    element.id = contactuuid;
    var invitename = "'" + contactname + "'";
    var calluuid = "'" + contactuuid + "'";
    var defaultimage = '"../../images/contacts/default.jpg"';
    var HTML = '<div id="SEARCH_imagediv"><img id="SEARCH_image" src="../../images/contacts/' + contactuuid + '.jpg" class="ContactImage" onerror=this.src=' + defaultimage + ' alt="' + alt + '"  height="' + height + '" width="' + width + '"><textarea id="SEARCH_textarea">' + contactname + '</textarea><button type="button" id="SEARCH_invitebutton" onclick="CONTACT_sendinvite(' + invitename + ')">Invite</button><button type="button" id="SEARCH_callbutton" onclick="CONTACT_Call(' + calluuid + ')">Call</button></div>'
    //var HTML = '<img src="../../images/contacts/' + contactuuid + '.jpg" class="ContactImage" onerror=this.src=' + defaultimage + ' alt="' + alt + '"  height="' + height + '" width="' + width + '"><button id="' + calluuid + '" onclick="CONTACT_sendinvite(' + calluuid + ')">invite</button>';
    console.log(HTML);
    element.innerHTML = HTML;
    var x = document.getElementById("Contacts-list-container");
    x.appendChild(element);
}

function SEARCH_results(results) {
    var contacts = results.split("|");
    for (var i = 0; i < contacts.length; i++) {
        if (contacts[i] != "") {
            data = contacts[i].split(";");
            var id = data[1]; //ID of user
            SEARCH_loadcontacts(id, data[0], 276, 200, data[0]);
        }
    }
}

//CALL Settings and popup
// Get the modal

function PopupSetup() {
    var modal = document.getElementById('myModal');
    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];
    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
    modal.style.display = "block";
}

function CALL_Accepted() {
    answered = true;
    callaccepted = true;
    setTimeout(function () { init_videochat() }, 2000);
}

function CALL_Rejected() {
    answered = true;
    callaccepted = false;
}

function Incommingcall() {
    PopupSetup();
}