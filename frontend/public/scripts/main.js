//const { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } = require("constants");

apiURL = "http://localhost:4000/search/";
apiURLRental = "http://localhost:4000/rentals/";
apiURLRentalItems = "http://localhost:4000/rentalitems/";
apiURLPermissions = "http://localhost:4000/permissions/";
apiURLPending = "http://localhost:4000/pending/";
apiURLAuth = "http://localhost:4000/auth/";
apiURLCart = "http://localhost:4000/cart/";
apiURLAddToCart = "http://localhost:4000/cartadd/";
apiURLMakeCart = "http://localhost:4000/makecart/";
apiURLClubMember = "http://localhost:4000/clubmember/";
apiURLClubMemberAdd = "http://localhost:4000/clubmemberadd/";
apiURLCartRemove = "http://localhost:4000/cartremove/";
var defaultSearchword = "DEFAULT_SEARCH_PARAM";
var uid;

//From https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
}

function main() {
    console.log("IN MAIN\n");

    //check to see if a token is available
    var token = localStorage.getItem("token");
    //verify the token with the backend
    if (token) {
        fetch(apiURLAuth, {
            method: "POST",
            headers: {
                ['authorization']: token
            }
        }).then(
            response => response.json()
        ).then((data) => {
            //store valid token in local storage
            localStorage.setItem("token", token);
            //store the username in a global variable
            uid = data.username;
            let name = data.name;
            createClubMember(uid, name);
            //redirect to the homepage
            document.location = `body.html#home`;
            //change signin button to a signout button
            document.querySelector("#signin").textContent = "Sign Out";
            document.querySelector("#signin").onclick = (event) => {
                //remove token from storage
                localStorage.removeItem("token");
                //redirect to login page
                document.location = `index.html`;
            }
            //change title to current rentals
            document.querySelector("#rentalsTitle").innerHTML = "Current Rentals";
            document.querySelector(".search-container").style.display = "none";
            loadRentals(uid);
        });
    } else {
        //redirect to login page if not already there
        if (!document.querySelector("#loginPage")) {
            document.location = `index.html`;
        }
        //set up the rosefire signin button
        document.querySelector("#rosefireButton").onclick = (event) => {
            signIn();
        }
    }

    function createClubMember(uid, name) {
        fetch(apiURLClubMember + uid).then(
            response => response.json()
        ).then((data) => {
            if (data.length == 0) {
                console.log(
                    "create new member" + uid +name
                );
                createNewMember(uid, name);
            }
            console.log("no new member");
        });
    }

    function createNewMember(uid, name) {
        fetch(apiURLClubMemberAdd + uid +"&"+name).then(
            response => response.json()
        ).then((data) => {
            console.log("member added");
        });
    }
    // .catch(function () {
    //     console.log("error");
    // });
    //see if the user has executive status
    checkPermissions(uid);

    //load items on inventory page
    document.querySelector("#inventory").onclick = (event) => {
        document.querySelector("#rentalsTitle").innerHTML = "Items";
        document.querySelector(".search-container").style.display = "initial";
        loadEntries("");
    }

    //load items on cart page
    document.querySelector("#cart").onclick = (event) => {
        console.log("Start Cart with uid: " + uid);
        //Need to change SQL server to include renter's username
        getCartID(uid);
    }

    //load items on homepage
    document.querySelector("#home").onclick = (event) => {
        document.querySelector("#rentalsTitle").innerHTML = "Current Rentals";
        document.querySelector(".search-container").style.display = "none";
        loadRentals(uid);
    }

    //if enter is pressed in the searchbar, send a request for the searchword
    $(".search-container").keyup(function (event) {
        if (event.which === 13) {
            search();
        }
    });
    //on search button press
    document.querySelector("#search-button").onclick = (event) => {
        search();
    }
}

//find the id for the renter's cart
function getCartID(uid) {
    console.log("uid is =" + uid);
    fetch(apiURLCart + uid).then(
        response => response.json()
    ).then((data) => {
        console.log("data = ", data);
        loadRentalItems(data[0][0]);
        document.querySelector("#rentalsTitle").innerHTML = "Cart";
    });
}

//check for executive permissions
function checkPermissions(uid) {
    fetch(apiURLPermissions + uid).then(
        response => response.json()
    ).then((data) => {
        console.log(data);
        document.querySelector("#execPendingRentals").style.display = "initial";
        document.querySelector("#execPendingRentals").onclick = (params) => {
            document.querySelector(".search-container").style.display = "none";
            //load pending rentals
            loadPending();
        }
        console.log("finished");
    });
}

function loadPending() {
    document.querySelector("#rentalsTitle").innerHTML = "Pending Rentals";
    //empty the rentals container
    $("#rentalsContainer").innerHTML = "";
    //create a new replacement for the table
    const newList = htmlToElement('<div id="rentalsContainer" class="col-md-8"></div>');
    fetch(apiURLPending).then(
        response => response.json()
    ).then((data) => {
        console.log(data);
        for (var i = 0; i < data.length; i++) {
            //select and create templates
            let template = document.querySelector("#cardTemplate");
            let newCard = template.content.cloneNode(true);
            let interiorTemplate = document.querySelector("#listItemInteriorRental");
            //put the item name in the newCard
            newCard.querySelector(".inventory-listitem").innerHTML = data[i][1] + " to " + data[i][2];
            //define the interior structure for the description and set it to the item's description
            let interiorCard = interiorTemplate.content.cloneNode(true);
            (function (i) {
                var id = data[i][0];
                interiorCard.querySelector(".detailsButton").onclick = (event) => {
                    loadRentalItems(id);
                };
            })(i);
            interiorCard.querySelector(".description").innerHTML = data[i][0]; //TODO: week 9 do this so click works and detail show
            //appent the interior card to the list item
            newCard.querySelector(".inventory-listitem").append(interiorCard);
            //add the card to the new list
            newList.append(newCard);
        }
        //removes the old rentalsContainer and id
        const oldList = document.querySelector("#rentalsContainer");
        oldList.removeAttribute("id");
        //hide the old container and replace with the new list
        oldList.hidden = true;
        oldList.parentElement.appendChild(newList);
        console.log("finished");
    });
}

// simple search to get searchword and request the entries
function search() {
    let searchword = document.querySelector("#search").value;
    console.log(searchword);
    loadEntries(searchword);
}



//sign in using rosefire
function signIn() {
    // Please note this needs to be the result of a user interaction
    // (like a button click) otherwise it will get blocked as a popup
    Rosefire.signIn("79ebc86f-8bf2-42fd-a13d-de48c533ff61", (err, rfUser) => {
        if (err) {
            console.log("Rosefire error!", err);
            return;
        }
        console.log("Rosefire success!", rfUser);

        //check token with backend
        fetch(apiURLAuth, {
            method: "POST",
            headers: {
                "authorization": rfUser.token
            }
        }).then(
            response => response.json()
        ).then((data) => {
            //store the token in local storage
            localStorage.setItem("token", rfUser.token);
            uid = rfUser.username;
            //swithch to home page and change signin button to sign out
            document.location = `body.html#home`;
            document.querySelector("#signin").textContent = "Sign Out";
            document.querySelector("#signin").onclick = (event) => {
                localStorage.removeItem("token");
                document.location = `index.html`;
            }
        });
    });
}

function loadRentals(parameter) {
    document.querySelector("#rentalsTitle").innerHTML = "Current Rentals";
    //empty the rentals container
    $("#rentalsContainer").innerHTML = "";
    //create a new replacement for the table
    const newList = htmlToElement('<div id="rentalsContainer" class="col-md-8"></div>');
    //request the items with the URL and search word
    fetch(apiURLRental + parameter).then(
        response => response.json()
    ).then((data) => {
        console.log(data);
        //loop through the data entering information to the card
        for (var i = 0; i < data.length; i++) {
            //select and create templates
            let template = document.querySelector("#cardTemplate");
            let newCard = template.content.cloneNode(true);
            let interiorTemplate = document.querySelector("#listItemInteriorRental");
            //put the item name in the newCard
            newCard.querySelector(".inventory-listitem").innerHTML = data[i][1] + " to " + data[i][2];
            //define the interior structure for the description and set it to the item's description
            let interiorCard = interiorTemplate.content.cloneNode(true);
            (function (i) {
                var id = data[i][0];
                interiorCard.querySelector(".detailsButton").onclick = (event) => {
                    loadRentalItems(id);
                };
            })(i);
            interiorCard.querySelector(".description").innerHTML = data[i][0]; //TODO: week 9 do this so click works and detail show
            //appent the interior card to the list item
            newCard.querySelector(".inventory-listitem").append(interiorCard);
            //add the card to the new list
            newList.append(newCard);
        }
        console.log("finished");
    });
    //removes the old rentalsContainer and id
    const oldList = document.querySelector("#rentalsContainer");
    oldList.removeAttribute("id");
    //hide the old container and replace with the new list
    oldList.hidden = true;
    oldList.parentElement.appendChild(newList);
}

function loadRentalItems(id) {
    document.querySelector("#rentalsTitle").innerHTML = "Rental Items";
    //empty the rentals container
    $("#rentalsContainer").innerHTML = "";
    //create a new replacement for the table
    const newList = htmlToElement('<div id="rentalsContainer" class="col-md-8"></div>');
    //request the items with the URL and search word
    fetch(apiURLRentalItems + id).then(
        response => response.json()
    ).then((data) => {
        console.log(data);
        //loop through the data entering information to the card
        for (var i = 0; i < data.length; i++) {
            //select and create templates
            let template = document.querySelector("#cardTemplate");
            let newCard = template.content.cloneNode(true);
            let interiorTemplate = document.querySelector("#listItemInteriorRentalItems");
            //put the item name in the newCard
            newCard.querySelector(".inventory-listitem").innerHTML = data[i][3];
            (function (i) {
                var itemID = data[i][0];
                var rentalID = id;
                newCard.querySelector(".inventory-listitem").onclick = (event) => {
                    removeItemFromRental(itemID, rentalID);
                };
            })(i);
            //define the interior structure for the description and set it to the item's description
            let interiorCard = interiorTemplate.content.cloneNode(true);
            interiorCard.querySelector(".description").innerHTML = data[i][4];
            interiorCard.querySelector(".quantity").innerHTML = "Quantity: " + data[i][7];
            //appent the interior card to the list item
            newCard.querySelector(".inventory-listitem").append(interiorCard);
            //add the card to the new list
            newList.append(newCard);
        }
        console.log("finished");
    });
    //removes the old rentalsContainer and id
    const oldList = document.querySelector("#rentalsContainer");
    oldList.removeAttribute("id");
    //hide the old container and replace with the new list
    oldList.hidden = true;
    oldList.parentElement.appendChild(newList);
}

function removeItemFromRental(itemID, rentalID){
    fetch(apiURLCartRemove + rentalID + "&"+itemID).then(
        response => response.json()
    ).then((data) => {
        loadRentalItems(rentalID);
    });
}

function loadEntries(string) {
    console.log("got here\n");
    //if the search word is empty, use the default string
    if (string == "") {
        string = defaultSearchword;
    }
    //empty the rentals container
    $("#rentalsContainer").innerHTML = "";
    //create a new replacement for the table
    const newList = htmlToElement('<div id="rentalsContainer" class="col-md-8"></div>');
    //request the items with the URL and search word
    fetch(apiURL + string).then(
        response => response.json()
    ).then((data) => {
        console.log("response??\n");
        console.log(data);
        //loop through the data entering information to the card
        for (var i = 0; i < data.length; i++) {
            //select and create templates
            let template = document.querySelector("#cardTemplate");
            let newCard = template.content.cloneNode(true);
            let interiorTemplate = document.querySelector("#listItemInterior");

            //put the item name in the newCard
            newCard.querySelector(".inventory-listitem").innerHTML = data[i][3];
            //define the interior structure for the description and set it to the item's description
            let interiorCard = interiorTemplate.content.cloneNode(true);
            interiorCard.querySelector(".description").innerHTML = data[i][4];

            //appent the interior card to the list item
            newCard.querySelector(".inventory-listitem").append(interiorCard);


            (function (i) {
                var id = data[i][0];
                newCard.querySelector(".rent").onclick = (event) => {
                    console.log("Needs to add item to Rental");
                    addItemToRental(id);
                };
            })(i);
            // // NOT WORKING!!! Checks if the button has been clicked
            // newCard.querySelector(".rent").onclick = (event) => {
            //     console.log("Needs to add item to Rental");
            //     addItemToRental(data[i][0]);
            // } 

            //add the card to the new list
            newList.append(newCard);
        }
        console.log("finished");
    });
    //removes the old rentalsContainer and id
    const oldList = document.querySelector("#rentalsContainer");
    oldList.removeAttribute("id");
    //hide the old container and replace with the new list
    oldList.hidden = true;
    oldList.parentElement.appendChild(newList);
}

function addItemToRental(itemID) {
    console.log("uid is =" + uid);
    fetch(apiURLCart + uid).then(
        response => response.json()
    ).then((data) => {
        if (data.length == 0) {
            makeCart(itemID, uid);
        } else {
            console.log("add item to rental "+data);
            //addToCart(itemID, data[0][0]); //use this when username/id is fixed
            addToCart(itemID, data);
        }
    });
}

function makeCart(itemID, uid) {
    fetch(apiURLMakeCart + uid).then(
        response => response.json()
    ).then((data) => {
        console.log("make cart" +data);
        addToCart(itemID, data.ID);
    });
}

function addToCart(itemID, cartID) {
    console.log("addtocart");
    fetch(apiURLAddToCart + cartID + "&"+itemID).then(
        response => response.json()
    ).then((data) => {
        console.log("after add data = " + data);
    });
}

//Fix scrolling issues: https://www.w3schools.com/howto/howto_js_sticky_header.asp
// When the user scrolls the page, execute myFunction
window.onscroll = function () {
    scrollFct()
};

// Get the header
var header = document.getElementById("navbar");

// Get the offset position of the navbar
var sticky = header.offsetTop;

// Add the sticky class to the header when you reach its scroll position. Remove "sticky" when you leave the scroll position
function scrollFct() {
    if (window.pageYOffset > sticky) {
        header.classList.add("sticky");
    } else {
        header.classList.remove("sticky");
    }
}

// we have not done this part yet
// function loadEntry(id) {
//     selectedId = id;
//     let entry = fetch(apiURL + "id/" + id).then(
//         response => response.json()).then(data => {
//         document.querySelector("#inputName").value = data.name;
//         counter = data.count;
//         editEntryMode = true;
//         updateView();
//     });
// }

// function createEntry() {
//     let name = document.querySelector("#inputName").value;
//     let data = {
//         "name": name,
//         "count": counter
//     };

//     let entry = fetch(apiURL, {
//         method: "POST",
//         headers: {
//             "Content-Type": 'application/json'
//         },
//         body: JSON.stringify(data)
//     }).then((data) => {
//         editEntryMode = false;
//         document.querySelector("#inputName").value = "";
//         counter = 0;
//         updateView();
//         loadEntries();
//     }).catch((err) => {
//         console.log(err);
//     });
// }

// function deleteEntry() {
//     fetch(apiURL + "id/" + selectedId, {
//         method: "DELETE"
//     }).then(data => {
//         editEntryMode = false;
//         document.querySelector("#inputName").value = "";
//         counter = 0;
//         updateView();
//         loadEntries();
//     }).catch((err) => {
//         console.log(err);
//     });
// }


// function updateEntry() {
//     let name = document.querySelector("#inputName").value;
//     let data = {
//         "name": name,
//         "count": counter
//     };
//     fetch(apiURL + "id/" + selectedId, {
//         method: "PUT",
//         headers: {
//             "Content-Type": 'application/json'
//         },
//         body: JSON.stringify(data)
//     }).then(data => {
//         editEntryMode = false;
//         document.querySelector("#inputName").value = "";
//         counter = 0;
//         updateView();
//         loadEntries();
//     }).catch((err) => {
//         console.log(err);
//     });
// }

main();