var express = require("express");
var app = express();
var cors = require("cors");
app.use(cors());


//rosefire variables
var RosefireTokenVerifier = require('rosefire-node');
var rosefire = new RosefireTokenVerifier("5jWWnqqxHHIkZL4SrHbp");

//other stuff
const logger = require("morgan");
app.use(logger('dev')); //helpful info serverside when requests come in

app.use('/static', express.static("public"));

app.get("/main", function (req, res) {
    res.send("<h1>Goodbye!<h1>");
});

//rosefire post function
app.post('/auth', function (req, res) {
    var token = req.headers.authorization;
    if (!token) {
      res.status(401).json({
        error: 'Not authorized!'
      });
      return;
    }
    console.log("in post  " + token);
    rosefire.verify(token, function(err, authData) {
      if (err) {
        res.status(401).json({
          error: 'Not authorized!'
        });
      } else {
        console.log(authData.username); // rockwotj
        console.log(authData.issued_at); // <Date Object of issued time> 
        console.log(authData.group); // STUDENT (Only there if options asked)
        console.log(authData.expires) // <Date Object> (Only there if options asked)
        res.json(authData);
      }
    });
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
        executeStatement(res, connection, "EXEC [search_Item] @searchWord = '"+ searchword +"';");
        return;
    });
    connection.connect();
})


//search for items with a search word parameter
app.get("/rentals/:uid", function (req, res) {
    //retrieve the search word from the parameters
    let renterID = req.params.uid;
    console.log(renterID);
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
        executeStatement(res, connection, "EXEC [view_rentals_by_user] @RenterID = "+renterID+";");
        return;
    });
    connection.connect();
})



//find id of cart based on uid
app.get("/cart/:uid", function (req, res) {
    //retrieve the search word from the parameters
    let renterID = req.params.uid;
    console.log("renter ID is "+renterID);
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
        console.log("Connected in cart");
        //execute statement after the connection
        executeStatement(res, connection, "EXEC [cart_id] @RenterID = "+renterID+";");
        return;
    });
    connection.connect();
})


//show pending rentals
app.get("/pending", function (req, res) {
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
        executeStatement(res, connection, "SELECT * FROM Rental WHERE ExecutiveSignature is null"); // put in after tomorrow "RenterSignature is not null and"
        return;
    });
    connection.connect();
})

//search for items with a search word parameter
app.get("/rentalitems/:id", function (req, res) {
    let id = req.params.id;
    console.log(id);
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
        executeStatement(res, connection, "EXEC [view_items_in_rental] @RentalID = "+ id); // put in after tomorrow "RenterSignature is not null and"
        return;
    });
    connection.connect();
})

app.get("/permissions/:uid", function (req, res) {
    //retrieve the search word from the parameters
    let execID = req.params.uid;
    console.log(execID);
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
        executeStatement(res, connection, "SELECT * FROM Executive WHERE ID = "+execID+";");
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