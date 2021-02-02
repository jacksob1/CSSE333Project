var express = require("express");
var app = express();
var cors = require("cors");
app.use(cors());

require('./models/db');
const HelloEntry = require('./models/helloEntry');

// let data = [];

const logger = require("morgan");
app.use(logger('dev')); //helpful info serverside when requests come in

// const fs = require("fs");
// const serverSideStorage = "../data/db.json";

// fs.readFile(serverSideStorage, function (err, buf) {
//     if (err) {
//         console.log("error: ", err);
//     } else {
//         data = JSON.parse(buf.toString());
//     }
//     console.log("Data read from file.");
// });

// function saveToServer(data) {
//     fs.writeFile(serverSideStorage, JSON.stringify(data), function (err, buf) {
//         if (err) {
//             console.log("error: ", err);
//         } else {
//             console.log("Data saved successfully.");
//         }
//     })
// }

// middleware
var bodyParser = require("body-parser");
const {
    count
} = require("console");
app.use('/api/', bodyParser.urlencoded({
    extended: true
}));
app.use('/api/', bodyParser.json());

//read all
app.get("/api/", function (req, res) {
    HelloEntry.find({}, (err, entries) => {
        if (err) {
            res.json(err);
            res.status(404);
        } else {
            res.status(200);
            res.json(entries);
        }
    });
    // res.send(data);
    // res.end();
});

//create
app.post("/api/", function (req, res) {
    let name = req.body.name;
    let counter = req.body.count;
    HelloEntry.create({
        name: name,
        count: counter
    }, (err, entry) => {
        if (err) {
            res.status(400);
            res.json(err);
        } else {
            res.status(201);
            res.json(entry);
        }
    });
});

//read one
app.get("/api/id/:id", function (req, res) {
    let id = req.params.id;
    HelloEntry.findById(id, (err, entry) => {
        if (err) {
            res.status(404);
            res.json(err);
        } else {
            res.status(200);
            res.json(entry);
        }
    });
    // let result = data[id];
    // res.send(result);
    // res.end();
}).put("/api/id/:id", function (req, res) {
    let id = req.params.id;

    HelloEntry.findById(id, (err, helloEntry) => {
        helloEntry.name = req.body.name || helloEntry.name;
        helloEntry.count = req.body.count || helloEntry.count;
        helloEntry.save((err, entry) => {
            if (err) {
                res.status(404);
                res.json(err);
            } else {
                res.status(201);
                res.json(entry);
            }
        });
    });

    // let name = req.body.name;
    // let counter = req.body.count;
    // data[id] = {
    //     "name": name,
    //     "count": counter
    // };
    // saveToServer(data);
    // res.send("PUT Success");
    // res.end();
}).delete("/api/id/:id", function (req, res) {
    let id = req.params.id;

    HelloEntry.findByIdAndDelete(id, (err, helloEntry) => {
        if (err) {
            res.status(404);
            res.json(err);
        } else {
            res.status(204);
            res.json(null);
        }
    });

    // data.splice(id, 1);
    // saveToServer(data);
    // res.send("DELETE Success");
    // res.end();
});


app.listen(3000);