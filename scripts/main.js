define(['tedious'], function (require) {
    var username = 'jacksob1@rose-hulman.edu'; // Needs "Guest" account for viewing
    var pass = '3.14!%(TwoSixFive';








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

    var Connection = require('tedious').Connection;
    
    var connection = new Connection(config);
    connection.on('connect', function (err) {
        // If no error, then good to proceed.
        if (err) {
            console.log(err);
            process.exit(1);
        }
        console.log("Connected");
        executeStatement();
        return;
    });

    var Request = require('tedious').Request;

    function executeStatement() {
        var request = new Request("SELECT * FROM Item;", function (err) {
            if (err) {
                console.log(err);
            }
        });
        var result = "";
        $("#rentalsContainer").innerHTML = "";
        const newList = htmlToElement('<div id="rentalsContainer" class="col-md-8"></div>');
        request.on('row', function (columns) {
            columns.forEach(function (column) {
                if (column.value === null) {
                    console.log('NULL');
                } else {
                    result += column.value + "\t\t";
                    var template = document.querySelector("#cardTemplate");
                    var newCard = template.content.cloneNode(true);
                    newCard.querySelector(".inventory-listitem").innerHTML = column.value;
                    var interiorTemplate = document.querySelector("#listItemInterior");
                    //var interiorCard = interiorTemplate.content.cloneNode(true);
                    //interiorCard.querySelector(".item-pic").src = doc.data().src;
                    newCard.querySelector(".inventory-listitem").append(interiorCard);
                    newList.append(newCard);
                }
            });
            console.log(result);

            //removes the old rentalsContainer and id
            const oldList = document.querySelector("#rentalsContainer");
            oldList.removeAttribute("id");
            oldList.hidden = true;
            oldList.parentElement.appendChild(newList);
            result = "";
        });

        request.on('doneInProc', function (rowCount, more) {
            console.log(rowCount + ' rows returned');
        });

        request.on('requestCompvared', function () {
            connection.close();
        });

        connection.execSql(request);
    }
    connection.connect();
})