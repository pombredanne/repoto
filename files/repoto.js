"use strict";
exports.__esModule = true;

var atob = require('atob');
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
//var repobase="/data/slimbsp/slimbsp-test/.repo/manifests"

/* ----------------- repo branch -------------------------*/

app.get('/showrefs', function(req, res, next) {
    var refs = [];
    dump("[G] GET /showrefs ");
    res.writeHead(200, {'Content-Type': 'application/json'});
    exec( 'cd '+repobase+';git show-ref',   (error, stdout, stderr) => {
        if (error) {
            console.log(`exec error: ${error}`);
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

/* ----------------- git log -------------------------*/

function gitlogcmd(cmd, res, next) {
    var _refs = [];
    console.log("gitlogcmd:" + cmd);
    exec( cmd,   (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return next();
        }
        var shas = [];
        stdout.split(/\n/).map(e => {
            shas.push({'id':e.substr(0,40), 'd': e.substr(41,10), 'n':e.substr(41+11)});
        });
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(shas));
        return res.end("\n");
    });
}

app.get('/log/:sha/:count', function(req, res, next) {
    var _refs = [];
    var sha = req.params.sha;
    var count = req.params.count;
    dump("[G] GET /log : " + JSON.stringify(_refs));
    gitlogcmd( 'cd '+repobase+';git log --date=format:"%Y-%m-%d" --pretty=format:"%H %ad %s" ' + sha, res, next);
});

var cachedir = ".cache";

app.get('/logdiff/:path/:shafrom/:shato', function(req, res, next) {
    var _refs = [];
    var gitpath = atob(req.params.path);
    var shafrom = req.params.shafrom;
    var shato = req.params.shato;
    dump("[G] GET /logdiff : " + shafrom + ".." + shato);

    /* cache json */
    var cfile = cachedir + "/" + shafrom + "_" + shato + ".json";
    if (fs.existsSync(cfile)) {
        var j = fs.readFileSync(cfile);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(j);
        return res.end("\n");
    }

    var cmd0 = 'cd '+repobase+'/../../'+gitpath+';git log --date=format:"%Y-%m-%d" --pretty=format:"%H %ad %s" ' + shafrom + ".." + shato;  /* added */
    var cmd1 = 'cd '+repobase+'/../../'+gitpath+';git log --date=format:"%Y-%m-%d" --pretty=format:"%H %ad %s" ' + shato + ".." + shafrom;  /* removed */

    console.log("gitlogcmd:" + cmd0);
    exec( cmd0,   (error, stdout, stderr) => {
        if (error) {
            console.log(`exec error: ${error}`);
            return next();
        }
        var shas0 = [];
        stdout.split(/\n/).map(e => {
            if (e.trim().length)
                shas0.push({'id':e.substr(0,40), 'd': e.substr(41,10), 'n':e.substr(41+11)});
        });
        exec( cmd1,   (error, stdout, stderr) => {
            if (error) {
                console.log(`exec error: ${error}`);
                return next();
            }
            var shas1 = [];
            stdout.split(/\n/).map(e => {
                if (e.trim().length)
                    shas1.push({'id':e.substr(0,40), 'd': e.substr(41,10), 'n':e.substr(41+11)});
            });
            res.writeHead(200, {'Content-Type': 'application/json'});
            var j = JSON.stringify({'add':shas0,'rem':shas1});
            res.write(j);
            res.end("\n");

            fs.writeFile(cfile, j, (err) => {} );
            return;
        });
    });
});

/* ----------------- browse repo -------------------------*/

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
            try {
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
            } catch (e) {
                console.log(e);
            }
        }
        res.write(JSON.stringify(ret));
        return res.end("\n");
    });
});

/* ----------------- projlist  -------------------------*/

app.get('/projlist/:repoa/:repob', function(req, res, next) {
    var _refs = [];
    var h = {success : 0};
    var atob = require('atob');
    var repoa = atob(req.params.repoa);
    var repob = atob(req.params.repob);
    dump("[G] GET /projlist : " + repoa + " -> " + repob);
    res.writeHead(200, {'Content-Type': 'application/json'});
    var cmd = __dirname+"/../repoto.py list --json /tmp/.j,json "+repoa+" "+repob;
    console.log(cmd);
    var o = execSync(cmd);
    var h = fs.readFileSync("/tmp/.j,json");
    res.write(h);
    return res.end("\n");
});

app.get('/', function(req, res) {
    res.render('repoto');
});

app.use('/', express.static('.'));

//start our server
server.listen(process.env.PORT || 8999, function () {
    console.log("Server started on port " + server.address().port + " :)");
});
