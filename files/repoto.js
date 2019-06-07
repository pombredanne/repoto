"use strict";
exports.__esModule = true;

const path = require('path');
var fs = require('fs');
var express = require("express"),
    bodyParser = require('body-parser')
;

var http = require("http");
var WebSocket = require("ws");
const { exec } = require('child_process');
var mustacheExpress = require('mustache-express');

var app = express();

//initialize a simple http server
var server = http.createServer(app);

function dump(m) {
    console.log(m);
}

var VIEWS_PATH = __dirname + '/views'
app.engine('html', mustacheExpress(VIEWS_PATH + '/partials', '.html'));
app.set('view engine', 'html');
app.set('views', VIEWS_PATH);

app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});

app.get('/log/:sha/:count', function(req, res, next) {
    var _refs = [];
    var sha = req.params.sha;
    var count = req.params.count;
    dump("[G] GET /log : " + JSON.stringify(_refs));
    res.writeHead(200, {'Content-Type': 'application/json'});
    exec( 'git log --date=format:"%Y-%m-%d" --pretty=format:"%H %ad %s" ' + sha,   (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return next();
        }
        var shas = [];

        stdout.split(/\n/).map(e => {
            shas.push({'sha':e.substr(0,40), 'd': e.substr(41,10), 'n':e.substr(41+11)});
        });
        res.write(JSON.stringify(shas));
        return res.end("\n");
    });
});

app.get('/showrefs', function(req, res, next) {
    var _config = [];
    dump("[G] GET /status : " + JSON.stringify(_config));
    res.writeHead(200, {'Content-Type': 'application/json'});
    exec( 'git show-ref',   (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return next();
        }
        res.write(JSON.stringify({'g' : stdout }));
        return res.end("\n");
    });
});

var rpath = { 0 : "/tmp/" };
function registeredPath(id) {
    return rpath[id];
}

var index = 1;
function registerPath(p) {
    var i = index++;
    rpath[i] = p;
    return i;
}

app.get('/browse/:id/children', function(req, res, next) {
    var _refs = [];
    var id = req.params.id;
    var count = req.params.count;
    dump("[G] GET /log : " + JSON.stringify(_refs));
    res.writeHead(200, {'Content-Type': 'application/json'});
    var p = registeredPath(id);
    fs.readdir(p, function(err, items) {
        var ret = [];
        for (var f of items) {
            var abspath=fs.realpathSync(path.join(p, f));
            var stats = fs.statSync(abspath);
            var pid = registerPath(abspath);
            ret.push({ "id"  : id,
                       "pid" : pid,
                       "n" : abspath,
                       "branch" : stats.isDirectory() ? "true" : "false",
                       "kind" : stats.isDirectory() ? "directory" : "file"
                     });
        }
        res.write(JSON.stringify(ret));
    });
});

app.get('/', function(req, res) {
    res.render('repoto');
});

app.use('/', express.static('.'));

//start our server
server.listen(process.env.PORT || 8999, function () {
    console.log("Server started on port " + server.address().port + " :)");
});
