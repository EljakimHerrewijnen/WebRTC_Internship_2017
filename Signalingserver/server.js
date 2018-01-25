const HTTPS_PORT = 44395;

const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const bodyparser = require('body-parser');


// SSL configuration
const serverConfig = {
	ca: fs.readFileSync("./ssl2/COMODORSADomainValidationSecureServerCA.crt"),
	key: fs.readFileSync("./ssl2/cert.pem"),
	cert: fs.readFileSync("./ssl2/www_herreweb_nl.crt")
};

// ----------------------------------------------------------------------------------------

// Server for direct responses
var handleRequest = function(request, response) {
    // Render the single client html file for any request the HTTP server receives
    console.log('request received: ' + request.url);
	if(request.url === "/getonline"){
		var onlineuserlist = "";
		ClientIDlist.forEach(function(user){
			onlineuserlist += user + ";";
		})
		response.write(onlineuserlist);
		response.end();
	}
    else if(request.url ==="/"){
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

class connectioninfo{
	constructor(ws, uuid) {
		this.uuid = uuid;
		this.ws = ws;
	}
}

// Real server for calls
var wss = new WebSocketServer({server: httpsServer});
var chatrooms = [];
var Clientlist = [];
var ClientIDlist =[];

wss.on('connection', function(ws){
	var temp = ws;
    ws.on('message', function(message){
        var obj = JSON.parse(message);
		if(obj['sdp'] === "online"){
			clientid = obj['clientuuid'];
			Addonlineuser(clientid, temp);
		}
		if(obj['sdp'] === "getonline"){
			clientid = obj['clientuuid'];
			ws.uuid = clientid;
			var onlineuserlist = "";
			wss.clients.forEach(function(client){
				onlineuserlist += client.uuid + ";";
			})
			onlineuserlist = '"' + onlineuserlist + '"';
			var jsonobj = '{"function": "getonline", "userlist":' + onlineuserlist + ', "remoteclient":"0"}'
			JSON.stringify(jsonobj);
			ws.send(jsonobj);
		}
		if(obj['uuid'] === 0 || obj['remoteclient'] === 0){
			return;
		}
		
        var uuid = obj['uuid'];
        var clientuuid = obj['clientuuid']
		var remoteclient = obj['remoteclient'];
		wss.senddata(remoteclient, message);
    });
});

//Out dated, but left for reference
function Addonlineuser(userid, ws){
	var currentws = new connectioninfo();
	currentws.uuid = userid;
	currentws.ws = ws;
	for(var i = 0; i < ClientIDlist.length; i++){
		console.log(ClientIDlist[i].uuid);
		if(ClientIDlist[i].uuid === userid){
			return
		}
	}
	ClientIDlist.push(currentws);
}

//Out dated, but left for reference
function sendspecific(specificid, data, uuid){
	for(var i = 0; i < ClientIDlist.length; i++){
		if(ClientIDlist[i].uuid === specificid){
			console.log(ClientIDlist[i].ws.readyState)
			ClientIDlist[i].ws.send(data)
			if(ClientIDlist[i].ws.readyState === WebSocket.OPEN){
				ClientIDlist[i].ws.send(data);
			}
			
		}
	}
}


wss.senddata = function(sendid, data){
    this.clients.forEach(function(client){
		if(client.uuid === sendid && client.readyState === WebSocket.OPEN){
			client.send(data);
		}
    })
}

console.log('Server running. Visit https://localhost:' + HTTPS_PORT + ' in Firefox/Chrome (note the HTTPS; there is no HTTP -> HTTPS redirect!)');
