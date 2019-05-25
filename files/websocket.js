"use strict";
exports.__esModule = true;

var express = require("express");
var http = require("http");
var WebSocket = require("ws");
var spawn = require( 'child_process' );

var app = express();

//initialize a simple http server
var server = http.createServer(app);

//initialize the WebSocket server instance
var wss = new WebSocket.Server({ server: server });

wss.on('connection', function (ws) {
    //connection is up, let's add a simple simple event
    ws.on('message', function (message) {

        //log the received message and send it back to the client
        console.log('received: %s', message);
        ws.send("Hello, you sent -> " + message);

        function git_log(r) {

            ls = spawn( 'git', [ 'log', '--no-color', '-z', '--pretty=raw', '--show-notes', '--parents', '--boundary' ] );
            ls.stdout.on( 'data', data => {
                ws.send( `stdout: ${data}` );
            } );
            ls.stderr.on( 'data', data => {
                ws.send( `stderr: ${data}` );
            } );
            ls.on( 'close', code => {
                ws.send( `child process exited with code ${code}` );
            } );
        };

    });
    //send immediatly a feedback to the incoming connection    
    ws.send('Hi there, I am a WebSocket server');
});
//start our server
server.listen(process.env.PORT || 8999, function () {
    console.log("Server started on port " + server.address().port + " :)");
});
