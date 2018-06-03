var express = require("express"), httpProxy = require('http-proxy');
const bodyParser = require("body-parser");
const request = require('request').defaults({json: true});
var mongoClient = require("mongodb").MongoClient;
var objectId = require("mongodb").ObjectID;

const app = express();
var url = "mongodb://localhost:27017/";
var RateLimit = require('express-rate-limit');

//
//
var limiter = new RateLimit({
  windowMs: 15*60*1000, // 15 minutes
  max: 50, // limit each IP to 100 requests per windowMs
  delayMs: 0 // disable delaying - full speed until the max limit is reached
});
app.use(limiter);
//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.get("/users", function(req, res){
    mongoClient.connect(url, function(err, db){
        var dbo = db.db("Users");
        dbo.collection("user").find({}).toArray(function(err, users){
            res.send(users)
            db.close();
        });
    });
});
app.get("/sortedusers", function(req, res){
    mongoClient.connect(url, function(err, db){
        var dbo = db.db("Users");
        dbo.collection("user").find({}).sort( { username: -1 } ).toArray(function(err, users){
            res.send(users)
            db.close();
        });
    });
});
app.delete("/users/:id", function(req, res){
    var id = new objectId(req.params.id);
    mongoClient.connect(url, function(err, db){
        var dbo = db.db("Users");
        dbo.collection("user").findOneAndDelete({_id: id}, function(err, result){

            if(err) return res.status(400).send();
            res.send(result.value);
            db.close();
        });
    });
});
app.post("/getuser", function(req, res){
    mongoClient.connect(url, function(err, db){
      var user = req.body.username;
        var dbo = db.db("Users");
        dbo.collection('user').findOne({username: user}, function(err, answer){
            if(err) return res.status(400).send();

            res.send(answer);
            db.close();
        });
    });
});
app.put("/changepass", function(req, res){
    mongoClient.connect(url, function(err, db){
      var user = req.body.username;
      var oldpass = req.body.oldpassword;

      var newpass = req.body.newpassword;
        var dbo = db.db("Users");
        dbo.collection('user').findOneAndUpdate({username: user, password: oldpass}, { $set: {password: newpass}},
             {returnOriginal: false },function(err, result){
            if(err) return res.status(400).send();

            res.send(result.value);
            db.close();
        });
    });
});
app.post("/signup",function(req, res){
    var user = req.body.username;
    var pass = req.body.password;
    var real = req.body.realname;
    mongoClient.connect(url, function(err, db){
        var dbo = db.db("Users");
        var myobj = { username: user, password: pass, realName: real};
        dbo.collection('user').insertOne(myobj, function(err, answer){
            res.send(answer)
            db.close();
        });
    });
});
app.post("/login", function(req, res){
  var user = req.body.username;
  var pass = req.body.password;
    mongoClient.connect(url, function(err, db){
        var dbo = db.db("Users");
        dbo.collection('user').findOne({username: user, password: pass}, function(err, answer){
            if(err) return res.status(400).send();

            res.send(answer);
            db.close();
        });
    });
});

var server = app.listen(8000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log(host, port);
  console.log('App listening at http://%s:%s', host, port);
});
