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
var chatrooms = []; //Known as videochat UUID
var clientlist2 = [];

class Client{
    constructor(clientuuid, chatuuid, wss){
        this.clientuuid = clientuuid;
        this.chatuuid =chatuuid;
        this.wss = wss;
    }
}

wss.on('connection', function(ws){
    ws.on('message', function(message){
        var obj = JSON.parse(message);
        var uuid = obj['uuid'];
        var clientuuid = obj['clientuuid']
        wss.id = clientuuid;
        wss.uuid = clientuuid;
        wss.Addclient(clientuuid, wss);
        wss.joinRoom(uuid, message, clientuuid);
    });
});

wss.Addclient = function(clientuuid, wss){
    for(var i = 0; i < clientlist2.length; i++){
        if(clientlist2[i].clientuuid == clientuuid){
            return;
        }
    }
    var temp = new Client();
    temp.clientuuid = clientuuid;
    temp.wss = wss;
    clientlist2.push(temp);
}

// function dummy(){
//     for(var i = 0; i < clientlist2.length; i++){
//         clientlist2[i].wss.send()
//     }
// }

wss.joinRoom = function(uuid, data, clientuuid){
    for(var i = 0; i < chatrooms.length; i++){
        if(chatrooms[i] == uuid){
            for(var i = 0; i < clientlist2.length; i++){
                if(clientlist2[i].clientuuid === clientuuid){
                    clientlist2[i].chatuuid = uuid;
                }
            }
            wss.senddata(uuid, data, clientuuid);
            return;
        }
    }
    for(var i = 0; i < clientlist2.length; i++){
        if(clientlist2[i].clientuuid === clientuuid){
            clientlist2[i].chatuuid = uuid;
        }
    }
    chatrooms.push(uuid);
    wss.senddata(uuid, data, clientuuid);
};

wss.senddata = function(uuid, data, clientuuid){
    this.clients.forEach(function(client){
        if(client.readystate === WebSocket.Open){
            console.log("sending data...");
            client.send(data);
        }
    })
    console.log(chatrooms);
    // for(var i = 0; i < clientlist2.length; i++){
    //     if(clientlist2[i].chatuuid == uuid){
    //         clientlist2[i].wss.clients.forEach(function(client){
    //             if(client.readystate === WebSocket.OPEN){
    //                 console.log("sending data...");
    //                 client.send(data);
    //             }
    //            // if(client.readystate === WebSocket.OPEN){
                    
    //             //}
    //         })
    //     }
    // }
}

console.log('Server running. Visit https://localhost:' + HTTPS_PORT + ' in Firefox/Chrome (note the HTTPS; there is no HTTP -> HTTPS redirect!)');
