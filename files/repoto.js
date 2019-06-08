"use strict";
exports.__esModule = true;

const path = require('path');
var fs = require('fs');
var express = require("express"),
    bodyParser = require('body-parser')
;

var http = require("http");
var WebSocket = require("ws");
const { exec, execSync } = require('child_process');
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

var repobase="/home/eiselekd/src/android/ihu_abl_car.ww14_2019/.repo/manifests";

app.get('/showrefs', function(req, res, next) {
    var refs = [];
    dump("[G] GET /showrefs ");
    res.writeHead(200, {'Content-Type': 'application/json'});
    exec( 'cd '+repobase+';git show-ref',   (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return next();
        }
        stdout.split(/\n/).map(e => {
            if (e.length > 40)
                refs.push({'sha':e.substr(0,40), 'id': e.substr(41)});
        });

        res.write(JSON.stringify(refs));
        return res.end("\n");
    });
});


function revisionbaseSync(sha) {
    var d = repobase + '.revisions/' + sha;
    if (!fs.existsSync(d)) {
        var cmd = 'mkdir -p ' + repobase + '.revisions/; cd ' + repobase + '; git clone . ' + d;
        console.log(cmd);
        execSync( cmd );
        var cmd = 'cd ' + d + '; git checkout ' + sha;
        console.log(cmd);
        execSync(cmd);
    }
    return d;
}

app.get('/log/:sha/:count', function(req, res, next) {
    var _refs = [];
    var sha = req.params.sha;
    var count = req.params.count;
    dump("[G] GET /log : " + JSON.stringify(_refs));
    res.writeHead(200, {'Content-Type': 'application/json'});
    exec( 'cd '+repobase+';git log --date=format:"%Y-%m-%d" --pretty=format:"%H %ad %s" ' + sha,   (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return next();
        }
        var shas = [];

        stdout.split(/\n/).map(e => {
            shas.push({'id':e.substr(0,40), 'd': e.substr(41,10), 'n':e.substr(41+11)});
        });
        res.write(JSON.stringify(shas));
        return res.end("\n");
    });
});

app.get('/setrepo/:repo', function(req, res, next) {
    var _refs = [];
    var h = {success : 0};
    var atob = require('atob');
    var repo = atob(req.params.repo);
    dump("[G] GET /setrepo : " + repo);
    res.writeHead(200, {'Content-Type': 'application/json'});
    var rpath = path.join(repo, ".repo/manifests");
    if (fs.existsSync(rpath)) {
        repobase = rpath;
        h['success'] = 1;
    }
    res.write(JSON.stringify(h));
    return res.end("\n");
});

var rpath = { 0 : "/" };
function registeredPath(id) {
    return rpath[id];
}

var index = 1;
function registerPath(p) {
    var i = index++;
    rpath[i] = p;
    return i;
}

app.get('/browse/:sha/:id/children', function(req, res, next) {
    var _refs = [];
    var sha = req.params.sha;
    var id = req.params.id;
    var count = req.params.count;
    dump("[G] GET /child : " + sha + ":" + id);
    res.writeHead(200, {'Content-Type': 'application/json'});
    var p = "undef";
    if (sha != 0 && id == 0)  {
        p = revisionbaseSync(sha);
    } else {
        p = registeredPath(id);
    }
    fs.readdir(p, function(err, items) {
        var ret = [];
        for (var f of items) {
            var abspath=fs.realpathSync(path.join(p, f));
            var stats = fs.statSync(abspath);
            var cid = registerPath(abspath);

            ret.push({ "id"  : cid,
                       "pid" : id,
                       "n" : f,
                       "abspath" : abspath,
                       "branch" : stats.isDirectory() ? "true" : "false",
                       "kind" : stats.isDirectory() ? "directory" : "file"
                     });
        }
        res.write(JSON.stringify(ret));
        return res.end("\n");
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
