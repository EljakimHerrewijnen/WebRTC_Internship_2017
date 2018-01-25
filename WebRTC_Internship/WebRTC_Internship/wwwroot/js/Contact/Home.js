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
var countcontacts = 0;

var autoaccept = false;
var autofullscreen = false;

var peerConnectionConfig = {
    'iceServers': [
        { 'urls': 'stun:stun.services.mozilla.com' },
        { 'urls': 'stun:stun.l.google.com:19302' },
        // { 'urls': 'turn:turn:52.232.119.53:3478', 'credential': 'yourpassword', 'username':'youruser' },
        { 'urls': 'stun:stun1.l.google.com:19302' }
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

//Main engine of this application.
function gotMessageFromServer(message) {
    console.log("got message from server");
    var signal = JSON.parse(message.data);
    if (signal.function === "getonline") {
        onlineusers = signal.userlist;
        CONTACT_getcontacts();
        return;
    }
    if (!peerConnection && !answered) { receiveCall(signal.uuid, signal.clientuuid); }
    console.log("passed checkers, loading chat...");
    if (calling) {
        answered = true;
    }
    if (signal.sdp || signal.function === "sdp") {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function () {
            // Only create answers in response to offers
            if (signal.sdp.type === 'offer') {

                peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
            }
        }).catch(errorHandler);
    } else if (signal.ice) {
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

function resizeIframe() {
    var contactdiv = document.getElementById("Contacts-list-container");
    var height = countcontacts * 300;
    console.log(height);
    // contactdiv.style.height = contactdiv.contentWindow.document.body.scrollHeight + 'px';
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
    useruuid = $.ajax({ type: "GET", url: "/api/contact/getcurrentuser", async: false }).responseText;
    uuid = $.ajax({ type: "GET", url: "/api/videochat/generate_chat", async: false }).responseText;
    while (useruuid === null) { }
    setTimeout(function () { checkonlineusers(); }, 750);
    if (getCookie('AutoAccept') === 'true') {
        autoaccept = true;
        document.getElementById('switchaccept').checked = true;
    }
    if (getCookie('AutoFullScreen') === 'true') {
        autofullscreen = true;
        document.getElementById('switchfullscreen').checked = true;
        Action_fullscreen();
    }
    pageloaded = true;
}

$(document).ready(function () {
    pageReady();
});

//VIDEO Custom calls
function init_videochat() {
    var HTML = '<video id="localVideo" autoplay muted></video> <video id= "remoteVideo" autoplay></video>';
    var element = document.getElementById("Contacts-list-container");
    element.innerHTML = HTML;
    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');
    var container = document.getElementById('Contacts-list-container2');
    var HTML = '<button onclick="StopCall()" style="background-color: yellow; width: 250px; height:120px; margin-left: 50%;">Beeindig gesprek</button>';
    container.innerHTML = HTML;
    loadVideos();
    setTimeout(function () { start(calling); }, 2000);
}

function StopCall() {
    location.reload();
}

var popupactive = false;
function receiveCall(chatuuid, hostuuid) {
    remoteclient = hostuuid;
    console.log("Receiving call from: ", hostuuid);
    //Popup for accepting or rejecting calls
    if (autoaccept) {
        answered = true;
        callaccepted = true;
    }
    if (!answered) {
        Incommingcall();
    }
    uuid = chatuuid;
    var modal = document.getElementById('myModal');
    function check() {
        if (answered) {
            console.log("Answered call");
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
    console.log("Sending description...");
    setTimeout(function () { init_videochat() }, 2000);
    //setTimeout(function () { start(calling); }, 2000); 
}

//Sends a p2p request to the other user.
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
            alert("Er is een fout opgetreden. Als dit probleem aanhoud neemt u dan contact met ons op.");
            location.reload();
        })
        .always(function () {
        });
}

//Checks the online users from the back end. In production this MUST BE changed. 
function CONTACT_Checkonline(remoteuserid) {
    var temp = onlineusers.split(";");
    for (var i = 0; i < temp.length; i++) {
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

//Obscure function for creating clickable picture elements. For contacts. Nothing fancy, but it works
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
            var textarea = '<textarea readonly id="CONTACT_textarea"> ' + contactname + ' is online</textarea></div>';
        }
        else {
            var textarea = '<textarea readonly id="CONTACT_textarea"> ' + contactname + ' is offline</textarea></div>';
        }
        HTML += textarea;
    }
    else if (status === "Submitted") {
        x = document.getElementById("Contacts-list-container2");
        if (!createdparagraph) {
            createdparagraph = true;
            HTML += '<h2 id="CONTACT_IncommingInvites">Contact Invites</h2>'
        }
        HTML += '<div id="SEARCH_imagediv"><img id="CONTACT_image" src="../../images/contacts/' + contactuuid + '.jpg" class="ContactImage" onerror=this.src=' + defaultimage + ' alt="' + alt + '" height="' + height + '" width="' + width + '"onclick="CONTACT_Call(' + calluuid + ')' + '"><textarea readonly id="CONTACT_textarea">' + contactname + '</textarea><button type="button" id="CONTACT_acceptbutton" onclick="CONTACT_acceptinvite(true,' + calluuid + ')">Accept</button><button type="button" id="CONTACT_rejectbutton" onclick="CONTACT_acceptinvite(false,' + calluuid + ')">Reject</button></div>'
    }
    element.innerHTML = HTML;
    x.appendChild(element);
    countcontacts++;
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
    setTimeout(function () { location.reload(); }, 1000);
}

//I dont think I use this anymore
function CONTACT_UploadImage() {
    var fileUpload = $("#FileUpload1").get(0);
}

//Calling, this part does the actual ringing to the other user.
var counter = 0;
function CONTACT_Ringing() {
    if (counter > 25) { // 25 x 6 = 150 seconden
        counter = 0;
        location.reload();
    }
    console.log("ringing call...");
    if (answered) {
        console.log("Ringer ended...");
        return;
    }
    else {
        setTimeout(function () {
            counter++;
            CONTACT_Ringing();
            CONTACT_CheckSendCall();
        }, 6000);
    }
}

function CONTACT_CheckSendCall() {
    if (!answered) {
        start(calling);
    }
}

//Sends the actual calling request, because we know that the user has ansered the call
function CONTACT_Call(calluuid) {
    remoteclient = calluuid;
    calling = true;
    init_videochat();
    CONTACT_Ringing();
}

function CONTACT_sendinvite(username) {
    $.ajax({ type: "GET", url: "/api/contact/addcontact/" + username, async: false });
    setTimeout(function () { location.reload(); }, 1000);
}

//Search users from database. Will also check who is online, but this depends on the signalling server
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
    var HTML = '<div id="SEARCH_imagediv"><img id="SEARCH_image" src="../../images/contacts/' + contactuuid + '.jpg" class="ContactImage" onerror=this.src=' + defaultimage + ' alt="' + alt + '"  height="' + height + '" width="' + width + '"><textarea readonly id="SEARCH_textarea">' + contactname + '</textarea><button type="button" id="SEARCH_invitebutton" onclick="CONTACT_sendinvite(' + invitename + ')">Invite</button><button type="button" id="SEARCH_callbutton" onclick="CONTACT_Call(' + calluuid + ')">Call</button></div>'
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
// The modal size changes when the screen resolution changes. I never got this working very well and maybe this should be changed if used in production.

function PopupSetup() {
    var callacceptbutton = document.getElementById('callaccept');
    callacceptbutton.style['font-size'] = document.body.clientWidth * (26 / 800) + "px";
    var y = document.body.clientWidth * (26 / 800) + "px";
    callacceptbutton.style['height'] = document.body.clientWidth * (110 / 800) + "px";
    var calldenybutton = document.getElementById('calldeny');
    calldenybutton.style['font-size'] = document.body.clientWidth * (26 / 800) + "px";
    calldenybutton.style['height'] = document.body.clientWidth * (110 / 800) + "px";
    var modal = document.getElementById('myModal');
    var x = document.body.clientWidth * (400 / 800) + "px";
    if ((x * y) <= 2000) {
        x = x * 1.1;
    }
    modal.style['height'] = x + "px";
    var p = "U wordt gebeld door: " + remoteclient;
    modal.getElementsByTagName("p").innerHTML = p;
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

//Settings -- and some more toolsets.
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function setAutoAccept() {
    setCookie('AutoAccept', 'true', 365);
    setTimeout(function () { location.reload(); }, 500)
}

function removeAutoAccept() {
    setCookie('AutoAccept', 'true', -1);
    setTimeout(function () { location.reload(); }, 500)
}

function setFullScreen() {
    setCookie('AutoFullScreen', 'true', 365);
    setTimeout(function () { location.reload(); }, 500)
}

function removeFullScreen() {
    setCookie('AutoFullScreen', 'false', -1);
    setTimeout(function () { location.reload(); }, 500)
}

function AutoAccept_Changed() {
    if (document.getElementById('switchaccept').checked) {
        setAutoAccept();
    } else {
        removeAutoAccept();
    }
}

function AutoFullScreen_Changed() {
    if (document.getElementById('switchfullscreen').checked) {
        setFullScreen();
    } else {
        removeFullScreen();
    }
}

//Fullscreen - This does not work yet because it needs user input before a browser is allowed to go to fullscreen.
function requestFullScreen(element) {
    // Supports most browsers and their versions.
    var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;
    if (requestMethod) { // Native full screen.
        requestMethod.call(element);
    } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
        var wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
            wscript.SendKeys("{F11}");
        }
    }
}

function Action_fullscreen() {
    var elem = document.body; // Make the body go full screen.
    requestFullScreen(elem);
}