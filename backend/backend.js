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

//make the configuration to send to the connection
function makeConfig() {
    username = 'club_gear_application_account'; // Needs "Guest" account for viewing
    pass = 'csse333w2021';
    var config = {
        server: 'titan.csse.rose-hulman.edu',
        authentication: {
            type: 'default',
            options: {
                userName: `${username}`,
                password: `${pass}` 
            }
        },
        options: {
            // If you are on Microsoft Azure, you need encryption:
            encrypt: false,
            database: 'ClubGearLocker_S1G5_jacksob1_buczkob1_sorensej'
        }
    };
    return config;
}

//get all values from the items table
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

//search for items with a search word parameter
app.get("/search/:search", function (req, res) {
    //retrieve the search word from the parameters
    let searchword = req.params.search;
    //set to empty string if only default provided
    if (searchword == "DEFAULT_SEARCH_PARAM") {
        searchword = "";
    }
    console.log(searchword);
    //make connection and config
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
        //execute statement after the connection
        executeStatement(res, connection, "SELECT * FROM Item WHERE Item.Name LIKE '%" + searchword + "%';");
        return;
    });
    connection.connect();
})

//execute the the search statement and send a response using res and connection
function executeStatement(res, connection, searchStatement) {
    let data = [];
    //create the request using the search statement
    var Request = require('tedious').Request;
    request = new Request(searchStatement, function (err) {
        if (err) {
            console.log(err);
        }
    });

    //make an array of the columns
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
        //return the requested data
        res.send(data);
    });
    //execute the request
    connection.execSql(request);
}

//listen for any requests
app.listen(4000);