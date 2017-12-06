export function loadvideos() {
    var element = document.getElementById("Contacts-list-container")
    var HTML = '<video id="localVideo" autoplay muted style="width:40%;"></video> < video id= "remoteVideo" autoplay style= "width:40%;" ></video>';
    element.innerHTML = HTML;
}