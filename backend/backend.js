var express = require("express");
var bodyParser = require('body-parser');
var app = express();
var cors = require("cors");
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

//rosefire variables
var RosefireTokenVerifier = require('rosefire-node');
var rosefire = new RosefireTokenVerifier("5jWWnqqxHHIkZL4SrHbp");
var Request = require('tedious').Request;

//other stuff
const logger = require("morgan");
const { TYPES } = require("tedious");
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

//check to see if a club member exists
app.get("/clubmember/:uid", function (req, res) {
    let renterID = req.params.uid;
    var Connection = require('tedious').Connection;
    var config = makeConfig();
    var connection = new Connection(config);
    console.log("uid in app.get ",renterID);
    connection.on('connect', function (err) {
        // If no error, then good to proceed.
        if (err) {
            console.log(err);
            process.exit(1);
        }

        executeClubMember(res, connection, renterID);
        return;
    });
    connection.connect();
})

//check to see if a club member exists
app.post("/delete/:itemID", function (req, res) {
    let itemID = parseInt(req.params.itemID);
    var Connection = require('tedious').Connection;
    var config = makeConfig();
    console.log("ITEMID: ", itemID);
    var connection = new Connection(config);
    connection.on('connect', function (err) {
        // If no error, then good to proceed.
        if (err) {
            console.log(err);
            process.exit(1);
        }

        executeDelete(res, connection, itemID);
        return;
    });
    connection.connect();
})

//add an item to the inventory
app.post("/add/:name&:category&:price&:description&:quantity&:uid&:id", function (req, res) {
    let name = req.params.name;
    let category = req.params.category;
    let price = req.params.price;
    let description = req.params.description;
    let quantity = req.params.quantity;
    let uid = req.params.uid;
    console.log(category);
    var Connection = require('tedious').Connection;
    var config = makeConfig();
    var connection = new Connection(config);
    connection.on('connect', function (err) {
        // If no error, then good to proceed.
        if (err) {
            console.log(err);
            process.exit(1);
        }

        executeAdd(res, connection, name, category, price, description, quantity, uid);
        return;
    });
    connection.connect();
})

//add an item to the inventory
app.post("/edit/:name&:category&:price&:description&:quantity&:uid&:id", function (req, res) {
    let name = req.params.name;
    let category = req.params.category;
    let price = req.params.price;
    let description = req.params.description;
    let quantity = req.params.quantity;
    let uid = req.params.uid;
    let id = req.params.id;
    console.log(category);
    var Connection = require('tedious').Connection;
    var config = makeConfig();
    var connection = new Connection(config);
    connection.on('connect', function (err) {
        // If no error, then good to proceed.
        if (err) {
            console.log(err);
            process.exit(1);
        }

        executeEdit(res, connection, name, category, price, description, quantity, uid, id);
        return;
    });
    connection.connect();
})

//create a new club member
app.post("/clubmemberadd/:renterID&:name", function (req, res) {
    let renterID = req.params.renterID;
    let name = req.params.name;
    var Connection = require('tedious').Connection;
    var config = makeConfig();
    var connection = new Connection(config);
    console.log(renterID);
    connection.on('connect', function (err) {
        // If no error, then good to proceed.
        if (err) {
            console.log(err);
            process.exit(1);
        }

        executeClubMemberAdd(res, connection, renterID, name);
        return;
    });
    connection.connect();
})

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

        executeDB(res, connection);
        return;
    });
    connection.connect();
})

//get specific item
app.get("/item/:itemID", function (req, res) {
    let itemID = req.params.itemID;
    var Connection = require('tedious').Connection;
    var config = makeConfig();
    var connection = new Connection(config);
    connection.on('connect', function (err) {
        // If no error, then good to proceed.
        if (err) {
            console.log(err);
            process.exit(1);
        }

        executeItem(res, connection, itemID);
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

        executeSearch(res, connection, searchword);
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

        executeRentals(res, connection, renterID);
        return;
    });
    connection.connect();
})

//add an item to the cart
app.post("/cartadd/:rentalID&:itemID&:quantity", function (req, res) {
    //retrieve the search word from the parameters
    var rentalID = req.params.rentalID;
    var itemID = req.params.itemID;
    let quantity = req.params.quantity;
    console.log("rentalid: "+rentalID+" itemid: "+itemID);
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

        executeCartAdd(res, connection, rentalID, itemID, quantity);
        return;
    });
    connection.connect();
})


//remove an item to the cart
app.get("/cartremove/:rentalID&:itemID", function (req, res) {
    //retrieve the search word from the parameters
    var rentalID = req.params.rentalID;
    var itemID = req.params.itemID;
    console.log("rentalid: "+rentalID+" itemid: "+itemID);
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

        executeCartRemove(res, connection, rentalID, itemID);
        return;
    });
    connection.connect();
})


//make a new cart if the user doesn not have one
app.get("/makecart/:uid", function (req, res) {
    //retrieve the search word from the parameters
    let renterID = req.params.uid;
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

        executeMakeCart(res, connection, renterID);
        return;
    });
    connection.connect();
})

//make a new category
app.post("/addcategory/:category", function (req, res) {
    //retrieve the search word from the parameters
    let category = req.params.category;
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

        executeAddCategory(res, connection, category);
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

        executeCart(res, connection, renterID);
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
        
        executePending(res, connection);
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

        executeRentalItems(res, connection, id);
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

        executePermissions(res, connection, execID);
        return;
    });
    connection.connect();
})

app.post("/submitForm/:name&:address&:city&:state&:zip&:startDate&:endDate&:cartID", function(req, res){
    let name = req.params.name;
    let address = req.params.address;
    let city = req.params.city;
    let state = req.params.state;
    let zip = req.params.zip;
    let sign = req.body;
    let startDate = req.params.startDate;
    let endDate = req.params.endDate;
    let cartID = req.params.cartID;

    var Connection = require('tedious').Connection;
    var config = makeConfig();
    var connection = new Connection(config);
    connection.on('connect', function(err){
        if(err){
            console.log(err);
            process.exit(1);
        }
        console.log( "EXEC [update_Rental] @ID = "+cartID+", @newStartDate = '"+startDate+"', @newEndDate = '"+endDate+"', @newRenterSignature = "+sign+";");

        executeSubmitForm(res, connection, cartID, startDate, endDate, sign);
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

function executeSubmitForm(res, connection, cartID, startDate, endDate, sign){
    let data = [];

    //create the request
    var Request = require('tedious').Request;
    request = new Request(`EXEC [update_Rental] @ID = @cartID, @newStartDate = @startDate, @newEndDate = @endDate, @newRenterSignature = @sign;`, function(err){
        if(err){
            console.error(err);
        }
    });

    request.addParameter('cartID', TYPES.Int, cartID);
    request.addParameter('startDate', TYPES.Date, startDate);
    request.addParameter('endDate', TYPES.Date, endDate);
    request.addParameter('sign', TYPES.Text, sign);

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

function executePermissions(res, connection, execID){
    let data = [];

    var Request = require('tedious').Request;
    request = new Request(`EXEC [get_Executive] @ID = @execID`, function(err){
        if(err){
            console.log(err);
        }
    });

    request.addParameter('execID', TYPES.NVarChar, execID);

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

function executeRentalItems(res, connection, id){
    let data = [];

    var Request = require('tedious').Request;
    request = new Request(`EXEC [view_items_in_rental] @RentalID = @id`, function(err){
        if(err){
            console.log(err);
        }
    });

    request.addParameter('id', TYPES.Int, id);

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

function executePending(res, connection){
    let data = [];

    var Request = require('tedious').Request;
    request = new Request(`SELECT * FROM Rental WHERE ExecutiveSignature is null AND RenterSignature is not null`, function(err){
        if(err){
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

function executeCart(res, connection, renterID){
    let data = [];

    var Request = require('tedious').Request;
    request = new Request(`EXEC [cart_id] @RenterID = @renterID`, function(err){
        if(err){
            console.log(err);
        }
    });

    request.addParameter('renterID', TYPES.NVarChar, renterID);

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

function executeAddCategory(res, connection, category){
    let data = [];

    var Request = require('tedious').Request;
    request = new Request(`EXEC [create_Category] @Name = @category`, function(err){
        if(err){
            console.log(err);
        }
    });

    request.addParameter('category', TYPES.VarChar, category);

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

function executeMakeCart(res, connection, renterID){
    let data = [];

    var Request = require('tedious').Request;
    request = new Request(`EXEC [create_Rental] @RenterID = @ID`, function(err){
        if(err){
            console.log(err);
        }
    });

    request.addParameter('ID', TYPES.NVarChar, renterID);

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

function executeCartRemove(res, connection, rentalID, itemID){
    let data = [];

    var Request = require('tedious').Request;
    request = new Request(`EXEC [delete_RentedIn] @RentalID = @rentalID, @ItemID = @itemID;`, function(err){
        if(err){
            console.log(err);
        }
    });

    request.addParameter('rentalID', TYPES.Int, rentalID);
    request.addParameter('itemID', TYPES.Int, itemID);

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

function executeCartAdd(res, connection, rentalID, itemID, quantity){
    let data = [];

    var Request = require('tedious').Request;
    request = new Request(`EXEC [create_RentedIn] @RentalID = @rentalID, @ItemID = @itemID, @Quantity = @number;`, function(err){
        if(err){
            console.log(err);
        }
    });

    request.addParameter('rentalID', TYPES.Int, rentalID);
    request.addParameter('itemID', TYPES.Int, itemID);
    request.addParameter('number', TYPES.Int, quantity);

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

function executeRentals(res, connection, renterID){
    let data = [];

    var Request = require('tedious').Request;
    request = new Request(`EXEC [view_rentals_by_user] @RenterID = @renterID;`, function(err){
        if(err){
            console.log(err);
        }
    });

    request.addParameter('rentalID', TYPES.NVarChar, renterID);

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

function executeSearch(res, connection, searchword){
    let data = [];

    var Request = require('tedious').Request;
    request = new Request(`EXEC [search_Item] @searchWord = @search;`, function(err){
        if(err){
            console.log(err);
        }
    });

    request.addParameter('search', TYPES.VarChar, searchword);

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

function executeItem(res, connection, itemID){
    let data = [];

    var Request = require('tedious').Request;
    request = new Request(`SELECT * FROM Item WHERE Item.ItemID = @itemID;`, function(err){
        if(err){
            console.log(err);
        }
    });

    request.addParameter('itemID', TYPES.Int, itemID);

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

function executeDB(res, connection){
    let data = [];

    var Request = require('tedious').Request;
    request = new Request(`SELECT * FROM Item;`, function(err){
        if(err){
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

function executeClubMemberAdd(res, connection, renterID, name){
    let data = [];

    var Request = require('tedious').Request;
    request = new Request(`EXEC [create_ClubMember] @MemberID = @renterID, @Name = @name;`, function(err){
        if(err){
            console.log(err);
        }
    });

    request.addParameter('renterID', TYPES.NVarChar, renterID);
    request.addParameter('name', TYPES.VarChar, name);

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

function executeEdit(res, connection, name, category, price, description, quantity, uid, id){
    let data = [];

    var Request = require('tedious').Request;
    request = new Request(`EXEC [update_Item] @newTotalQuantity = @quantity, @newPrice = @price, @newName = @name, @newDescription = @description, @newCategory = @category, @newManager = @manager, @ItemID = @id;`, function(err){
        if(err){
            console.log(err);
        }
    });

    request.addParameter('quantity', TYPES.Int, quantity);
    request.addParameter('price', TYPES.Money, price);
    request.addParameter('name', TYPES.VarChar, name);
    request.addParameter('description', TYPES.VarChar, description);
    request.addParameter('category', TYPES.VarChar, category);
    request.addParameter('manager', TYPES.NVarChar, uid);
    request.addParameter('id', TYPES.Int, id);

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

function executeAdd(res, connection, name, category, price, description, quantity, uid){
    let data = [];

    var Request = require('tedious').Request;
    request = new Request(`EXEC [create_Item] @TotalQuantity = @quantity, @Price = @price, @Name = @name, @Description = @description, @Category = @category, @Manager = @manager;`, function(err){
        if(err){
            console.log(err);
        }
    });

    request.addParameter('quantity', TYPES.Int, quantity);
    request.addParameter('price', TYPES.Money, price);
    request.addParameter('name', TYPES.VarChar, name);
    request.addParameter('description', TYPES.VarChar, description);
    request.addParameter('category', TYPES.VarChar, category);
    request.addParameter('manager', TYPES.VarChar, uid);

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

function executeDelete(res, connection, itemID){
    let data = [];

    var Request = require('tedious').Request;
    request = new Request(`EXEC [delete_Item] @ItemID = @itemID;`, function(err){
        if(err){
            console.log(err);
        }
    });

    request.addParameter('itemID', TYPES.Int, itemID);

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

function executeClubMember(res, connection, renterID){
    let data = [];

    var Request = require('tedious').Request;
    request = new Request(`SELECT * FROM ClubMember WHERE MemberID = @renterID`, function(err){
        if(err){
            console.log(err);
        }
    });

    request.addParameter('renterID', TYPES.NVarChar, renterID);

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