var express = require("express");
var app = express();
var cors = require("cors");
app.use(cors());

const logger = require("morgan");
app.use(logger('dev')); //helpful info serverside when requests come in

app.use('/static', express.static("public"));

app.get("/main", function (req, res) {
    res.send("<h1>Goodbye!<h1>");
});

function makeConfig() {
    username = 'club_gear_application_account'; // Needs "Guest" account for viewing
    pass = 'csse333w2021';
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
    return config;
}

app.get("/db", function (req, res) {
    var Connection = require('tedious').Connection;
    var config = makeConfig();
    var connection = new Connection(config);
    connection.on('connect', function (err) {
        // If no error, then good to proceed.
        if (err) {
            console.log(err);
            process.exit(1);
        }
        console.log("Connected");
        executeStatement(res, connection, "SELECT * FROM Item;");
        return;
    });
    connection.connect();
})


function executeStatement(res, connection, searchStatement) {
    let data = [];
    var Request = require('tedious').Request;
    request = new Request(searchStatement, function (err) {
        if (err) {
            console.log(err);
        }
    });
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
    });

    connection.execSql(request);
}


app.get("/search/:search", function (req, res) {
    let searchword = req.params.search;
    if (searchword == "DEFAULT_SEARCH_PARAM") {
        searchword = "";
    }
    console.log(searchword);
    var Connection = require('tedious').Connection;
    var config = makeConfig();
    var connection = new Connection(config);
    connection.on('connect', function (err) {
        // If no error, then good to proceed.
        if (err) {
            console.log(err);
            process.exit(1);
        }
        console.log("Connected");
        executeStatement(res, connection, "SELECT * FROM Item WHERE Item.Name LIKE '%" + searchword + "%';");
        return;
    });
    connection.connect();
})

app.listen(4000);