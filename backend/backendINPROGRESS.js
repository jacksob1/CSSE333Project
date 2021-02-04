var express = require("express");
var app = express();
// var fs = require("fs");
var cors = require("cors");
app.use(cors());

require('./models/db');
const HelloEntry = require('./models/helloEntry');

// let data = [];

var requestDB = new Request("SELECT * FROM Item;", function (err) {
    if (err) {
        console.log(err);
    }
});

const logger = require("morgan");
app.use(logger('dev')); //helpful info serverside when requests come in



// username = 'club_gear_application_account'; // Needs "Guest" account for viewing
// pass = 'csse333w2021';

username = 'sorensej'; // Needs "Guest" account for viewing
pass = '20004009';

var Connection = require('tedious').Connection;
var config = {
    server: 'titan.csse.rose-hulman.edu', //update me
    authentication: {
        type: 'default',
        options: {
            userName: `${username}`, //update me
            password: `${pass}` //update me
        }
    },
    options: {
        // If you are on Microsoft Azure, you need encryption:
        encrypt: false,
        database: 'ClubGearLocker_S1G5_jacksob1_buczkob1_sorensej' //update me
    }
};

var connection = new Connection(config);
connection.on('connect', function (err) {
    // If no error, then good to proceed.
    if (err) {
        console.log(err);
        process.exit(1);
    }
    console.log("Connected");
    // executeStatement(requestDB);
    return;
});

var Request = require('tedious').Request;
var Types = require('tedious').TYPES;

let data = [];


function executeStatement(request) {
    request.on('row', function (columns) {
        let arr = [];
        columns.forEach(function (column) {
            let value = "";
            if (column.value === null) {
                value += 'NULL';
            } else {
                value += column.value + "";
            }
            arr.push(value);
        });
        data.push(arr);
    });

    request.on('doneInProc', function (rowCount, more) {
        console.log(rowCount + ' rows returned');
    });

    request.on('requestCompleted', function () {
        connection.close();
        res.send(data);
        // data.forEach(function(row) {
        //     stringThing += "<ul>\n";
        //     stringThing += "<ol>Row "+num+"</ol>\n";
        //     row.forEach(function(col) {
        //         stringThing += "<ol>"+col+"</ol>\n";
        //     });
        //     stringThing += "</ul>\n";
        //     stringThing += "<br>";
        //     num++;
        //     //console.log(num);
        // });
        // res.send(stringThing);
    });
    connection.execSql(request);

}


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
const { request } = require("http");
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

app.use('/static', express.static("public"));

app.get("/main", function (req, res) {
    res.send("<h1>Goodbye!<h1>");
});

app.get("/search/:search", function (req, res) {
    let searchword = req.params.search;
    requestDB = new Request("SELECT * FROM Item WHERE Item.Name LIKE '%" + searchword + "%';", function (err) {
        if (err) {
            console.log(err);
        }
    });
    connection.connect();
    executeStatement(requestDB);
});
//     request.on('row', function (columns) {
//         let arr = [];
//         columns.forEach(function (column) {
//             let value = "";
//             if (column.value === null) {
//                 value += 'NULL';
//             } else {
//                 value += column.value + "";
//             }
//             arr.push(value);
//         });
//         data.push(arr);
//     });

//     request.on('doneInProc', function (rowCount, more) {
//         console.log(rowCount + ' rows returned');
//     });

//     request.on('requestCompleted', function () {
//         connection.close();
//         res.send(data);
//     });

// })

app.get("/db", function (req, res) {
    // username = 'sorensej'; // Needs "Guest" account for viewing
    // pass = '20004009';

    // var Connection = require('tedious').Connection;  
    // var config = {  
    //     server: 'titan.csse.rose-hulman.edu',  //update me
    //     authentication: {
    //         type: 'default',
    //         options: {
    //             userName: `${username}`, //update me
    //             password: `${pass}`  //update me
    //         }
    //     },
    //     options: {
    //         // If you are on Microsoft Azure, you need encryption:
    //         encrypt: false,
    //         database: 'ClubGearLocker_S1G5_jacksob1_buczkob1_sorensej'  //update me
    //     }
    // };  
    // var connection = new Connection(config);  
    // connection.on('connect', function(err) {  
    //     // If no error, then good to proceed.
    //     if (err) {
    //         console.log(err);
    //         process.exit(1);
    //     }
    //     console.log("Connected");
    //     executeStatement();
    //     return;
    // });

    // var Request = require('tedious').Request;
    // var Types = require('tedious').TYPES;

    // let data = [];

    // function executeStatement() {
    //     request = new Request("SELECT * FROM Item;", function (err) {
    //         if (err) {
    //             console.log(err);
    //         }
    //     });
    //     request.on('row', function (columns) {
    //         let arr = [];
    //         columns.forEach(function (column) {
    //             let value = "";
    //             if (column.value === null) {
    //                 value += 'NULL';
    //             } else {
    //                 value += column.value + "";
    //             }
    //             arr.push(value);
    //         });
    //         data.push(arr);
    //     });

    //     request.on('doneInProc', function (rowCount, more) {
    //         console.log(rowCount + ' rows returned');
    //     });

    //     request.on('requestCompleted', function () {
    //         connection.close();
    //         let stringThing = "";
    //         let num = 1;
    //         res.send(data);
    //         // data.forEach(function(row) {
    //         //     stringThing += "<ul>\n";
    //         //     stringThing += "<ol>Row "+num+"</ol>\n";
    //         //     row.forEach(function(col) {
    //         //         stringThing += "<ol>"+col+"</ol>\n";
    //         //     });
    //         //     stringThing += "</ul>\n";
    //         //     stringThing += "<br>";
    //         //     num++;
    //         //     //console.log(num);
    //         // });
    //         // res.send(stringThing);
    //     });

    //     connection.execSql(request);
    // }
    requestDB = new Request("SELECT * FROM Item;", function (err) {
        if (err) {
            console.log(err);
        }
    });
    connection.connect();
    executeStatement(requestDB);
})

app.listen(3000);