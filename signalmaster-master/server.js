const HTTPS_PORT = 8443;

const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;

// SSL configuration
const serverConfig = {
    key: fs.readFileSync('./ssl/key2.key'),
    cert: fs.readFileSync('./ssl/cert2.cert'),
    passphrase: "123456789"
};

// ----------------------------------------------------------------------------------------

// Server for direct responses
var handleRequest = function(request, response) {
    // Render the single client html file for any request the HTTP server receives
    console.log('request received: ' + request.url);
    if(request.url ==="/"){
        response.write("This is the signaling server. You can not use the application from here.")
        response.end();
    }
    else{
        response.write("This is the signaling server. You can not use the application from here.")
        response.end();
    }
};
var httpsServer = https.createServer(serverConfig, handleRequest);
httpsServer.listen(HTTPS_PORT, '0.0.0.0');

// ----------------------------------------------------------------------------------------

// Real server for calls
var wss = new WebSocketServer({server: httpsServer});
var chatrooms = [];
var clientlist = [];

wss.on('connection', function(ws){
    console.log('new connection ');
    ws.on('message', function(message){
        var obj = JSON.parse(message);
        var uuid = obj['uuid'];
        var clientuuid = obj['clientuuid']
        clientlist += clientuuid;
        console.log("Client uuid == %s" + obj['clientuuid']);
        wss.joinRoom(uuid, message, clientuuid);
        //wss.broadcast(message);
    });
});

wss.joinRoom = function(uuid, data, clientuuid){
    console.log("Searching rooms...");
    var exists = false;
    var count = 0;
    for(var i = 0; i < chatrooms.length; i++){
        if(chatrooms[i] == uuid){
            console.log("Found one");
            exists = true;
            wss.senddata(uuid, data, clientuuid)
        }
        count = i + 1;
    }
    if(!exists){chatrooms[count] = uuid;}
    console.log(chatrooms);
};

wss.senddata = function(uuid, data, clientuuid){
    this.clients.forEach(function(client){
        console.log(client.uuid);
        var obj = JSON.parse(data);
        var chatUUID = obj['uuid'];
        console.log("Chat uuid == %s"+ chatUUID);
        var clientUUID = obj['clientuuid']
        console.log("CLIENT UUID = %s" + clientUUID);
        console.log("Far away uuid %s"+ clientuuid)
        if(chatUUID === uuid && client.readyState === WebSocket.OPEN){
            console.log("Found a matching UUID");
            client.send(data);
        }
    })
}
// wss.broadcast = function(data) {
//     console.log("broadcasting");
//     this.clients.forEach(function(client) {
//         if(client.readyState === WebSocket.OPEN) {
//             client.send(data);
//         }
//     });
// };

console.log('Server running. Visit https://localhost:' + HTTPS_PORT + ' in Firefox/Chrome (note the HTTPS; there is no HTTP -> HTTPS redirect!)');
