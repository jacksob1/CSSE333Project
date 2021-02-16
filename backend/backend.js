var express = require("express");
var bodyParser = require('body-parser');
var app = express();
var cors = require("cors");
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

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
        executeStatement(res, connection, "SELECT * FROM ClubMember WHERE MemberID = '"+renterID+"';");
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
        executeStatement(res, connection,`EXEC [delete_Item] @ItemID=${itemID}`);
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
        executeStatement(res, connection, `EXEC [create_Item] @TotalQuantity=${quantity}, @Price=${price}, @Name='${name}', @Description='${description}', @Category='${category}', @Manager='${uid}';`);
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
        executeStatement(res, connection, `EXEC [update_Item] @newTotalQuantity=${quantity}, @newPrice=${price}, @newName='${name}', @newDescription='${description}', @newCategory='${category}', @newManager='${uid}', @ItemID=${id};`);
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
        executeStatement(res, connection, "EXEC [create_ClubMember] @MemberID= "+renterID+", @Name = ["+name+"];");
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
        executeStatement(res, connection, "SELECT * FROM Item;");
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
        executeStatement(res, connection, `SELECT * FROM Item WHERE Item.ItemID = ${itemID};`);
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
        //execute statement after the connection
        executeStatement(res, connection, "EXEC [view_rentals_by_user] @RenterID = "+renterID+";");
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
        //execute statement after the connection
        executeStatement(res, connection, `EXEC [create_RentedIn] @RentalID = ${rentalID}, @ItemID = ${itemID}, @Quantity = ${quantity};`);
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
        //execute statement after the connection
        executeStatement(res, connection, `EXEC [delete_RentedIn] @RentalID = ${rentalID}, @ItemID = ${itemID};`);
        return;
    });
    connection.connect();
})


//make a new cart if the user doesn not have one
app.post("/makecart/:uid", function (req, res) {
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
        //execute statement after the connection
        executeStatement(res, connection, "EXEC [create_Rental] @RenterID = "+renterID+";");
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
        //execute statement after the connection
        executeStatement(res, connection, "EXEC [create_Category] @Name = "+category+";");
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
        //execute statement after the connection
        executeStatement(res, connection, "EXEC [cart_id] @RenterID = '"+renterID+"';");
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
        //execute statement after the connection
        executeStatement(res, connection, `EXEC [get_Executive] @ID=${execID}`);
        
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

        executeStatement(res, connection, "EXEC [update_Rental] @ID = "+cartID+", @newStartDate = "+startDate+", @newEndDate = "+endDate+", @newRenterSignature = "+sign+";");
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