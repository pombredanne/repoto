"use strict";
exports.__esModule = true;

var express   = require("express");
var http      = require("http");
var WebSocket = require("ws");
var spawn     = require( 'child_process' );

var app       = express();

var server    = http.createServer(app);
var wss       = new WebSocket.Server({ server: server });

wss.on('connection', function (ws) {
    //connection is up, let's add a simple simple event
    ws.on('message', function (message) {
        console.log('received: %s', message);
        ws.send("request -> " + message);

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
    ws.send('Connect ack');
});
//start our server
server.listen(process.env.PORT || 8999, function () {
    console.log("Server started on port " + server.address().port + " :)");
});
