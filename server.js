const HTTPS_PORT = 8443;

const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;

// Yes, SSL is required
const serverConfig = {
    key: fs.readFileSync('./ssl/key2.key'),
    cert: fs.readFileSync('./ssl/cert2.cert'),
    passphrase: "123456789"
};

// ----------------------------------------------------------------------------------------

// Create a server for the client html page
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

// Create a server for handling websocket calls
var wss = new WebSocketServer({server: httpsServer});
rooms = [];

wss.on('connection', function(ws) {
    console.log("New connection");
    ws.on('message', function(message) {
        console.log('received: %s', message);
        wss.broadcast(message);

    });
});

wss.joinRoom = function(message){
    wss.broadcast(message);
}

wss.broadcast = function(data) {
    console.log("broadcasting");
    this.clients.forEach(function(client) {
        if(client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

console.log('Server running. Visit https://localhost:' + HTTPS_PORT + ' in Firefox/Chrome (note the HTTPS; there is no HTTP -> HTTPS redirect!)');
