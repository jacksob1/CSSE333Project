//const { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } = require("constants");

var rhit = rhit || {};

rhit.FB_KEY_NAME = "name";
rhit.FB_KEY_ZIP = "zip";
rhit.FB_KEY_STATE = "state";
rhit.FB_KEY_ADDRESS = "address";
rhit.FB_KEY_SIGNATURE = "signature";
rhit.FB_START = "startDate";
rhit.FB_END = "endDate";
rhit.FB_CITY = "city";

apiURL = "http://localhost:4000/search/";
apiURLRental = "http://localhost:4000/rentals/";
apiURLRentalItems = "http://localhost:4000/rentalitems/";
apiURLPermissions = "http://localhost:4000/permissions/";
apiURLPending = "http://localhost:4000/pending/";
apiURLAuth = "http://localhost:4000/auth/";
apiURLCart = "http://localhost:4000/cart/";
apiURLAdd = "http://localhost:4000/add/";
apiURLEdit = "http://localhost:4000/edit/";
apiURLDelete = "http://localhost:4000/delete/";
apiURLAddToCart = "http://localhost:4000/cartadd/";
apiURLMakeCart = "http://localhost:4000/makecart/";
apiURLClubMember = "http://localhost:4000/clubmember/";
apiURLClubMemberAdd = "http://localhost:4000/clubmemberadd/";
apiURLCartRemove = "http://localhost:4000/cartremove/";
apiURLSubmitForm = "http://localhost:4000/submitForm/";
apiURLItem = "http://localhost:4000/item/";

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
        console.log("here");
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
            if (!document.querySelector("#formNav")&&document.querySelector("#loginNav")){
                document.location = `body.html#home`;
            }
            //change signin button to a signout button
            if (document.querySelector("#signin")) {
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
                checkPermissions(uid);
                loadRentals(uid);
            }
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
                    "create new member" + uid + name
                );
                createNewMember(uid, name);
            } else {
                console.log("no new member");
            }
        });
    }

    function createNewMember(uid, name) {
        fetch(apiURLClubMemberAdd + uid + "&" + name).then(
            response => response.json()
        ).then((data) => {
            console.log("member added");
        });
    }
    // .catch(function () {
    //     console.log("error");
    // });
    //see if the user has executive status

    if (document.querySelector("#checkOutButton")) {
        document.querySelector("#checkOutButton").style.display = "none";
    }

    //load items on inventory page
    if (document.querySelector("#inventory")) {
        document.querySelector("#inventory").onclick = (event) => {
            document.querySelector("#rentalsTitle").innerHTML = "Items";
            document.querySelector(".search-container").style.display = "initial";
            document.querySelector("#checkOutButton").style.display = "none";
            document.querySelector("#addButton").style.display = "none";
            loadEntries("", false);
        }
    }

    //load items on cart page
    if (document.querySelector("#cart")) {
        document.querySelector("#cart").onclick = (event) => {
            console.log("Start Cart with uid: " + uid);
            document.querySelector(".search-container").style.display = "none";
            document.querySelector("#checkOutButton").style.display = "initial";
            document.querySelector("#addButton").style.display = "none";
            document.querySelector("#checkOutButton").onclick = (event) => {
                checkOut();
            }
            //Need to change SQL server to include renter's username
            getCartID(uid);
        }
    }

    //load items on homepage
    if (document.querySelector("#home")) {
        document.querySelector("#home").onclick = (event) => {
            document.querySelector("#rentalsTitle").innerHTML = "Current Rentals";
            document.querySelector(".search-container").style.display = "none";
            document.querySelector("#addButton").style.display = "none";
            loadRentals(uid);
        }
    }

    // set up the executive inventory page
    if (document.querySelector("#execInventory")) {
        document.querySelector("#execInventory").onclick = (event) => {
            document.querySelector("#rentalsTitle").innerHTML = "Items";
            document.querySelector(".search-container").style.display = "initial";
            document.querySelector("#addButton").style.display = "initial";
            // on modal save button press
            document.querySelector("#addSaveButton").onclick = (event) => {
                getModalValues(true, -1);
            }
            loadEntries("", true);
        }
    }
    let isManagement = false;

    //if enter is pressed in the searchbar, send a request for the searchword
    if (document.querySelector("#execInventory")) {
        isManagement = true;
    }
    if (document.querySelector("#search-button")) {
        $(".search-container").keyup(function (event) {
            if (event.which === 13) {
                search(isManagement);
            }
        });
        //on search button press
        document.querySelector("#search-button").onclick = (event) => {
            search(isManagement);
        }
    }
}

function getModalValues(isAdd, id) {
    let url = apiURLAdd;
    if (isAdd!=true){
        url = apiURLEdit;
    }
    const name = document.querySelector("#inputName").value;
    const category = document.querySelector("#inputCategory").value;
    const price = document.querySelector("#inputPrice").value;
    const description = document.querySelector("#descriptionInput").value;
    const quantity = document.querySelector("#inputQuantity").value;
    fetch(`${url}${name}&${category}&${price}&${description}&${quantity}&${uid}&${id}`).then(
        response => response.json()
    ).then((data) => {
        loadEntries("", true);
        console.log("item added");
    });
}

//checks out cart
function checkOut() {
    document.location = `formpage.html`;
    console.log("here");
    document.querySelector("#submitForm").onclick = (params) => {
        storeData();
    }
}

function storeData() {
    let name = document.querySelector("#inputName").value;
    let email = document.querySelector("#inputEmail").value;
    let phone = document.querySelector("#inputPhone").value;
    let idNum = document.querySelector("#inputId").value;
    let zip = document.querySelector("#inputZip").value;
    let state = document.querySelector("#inputState").value;
    let address = document.querySelector("#inputAddress").value;
    let items = rhit.fbCartManager.items;
    let signature = $('#sig').signature('toSVG');
    let price = document.querySelector("#gearCost").innerHTML;
    let quantities = rhit.fbCartManager.quantities;
    let signDate = document.querySelector("#inputSignDate").value;
    let startDate = document.querySelector("#inputStart").value;
    let endDate = document.querySelector("#inputEnd").value;
    let city = document.querySelector("#inputCity").value;
    let form = new rhit.Form(name, email, phone, idNum, zip, state, city, address, items, quantities, signature, signDate, price, startDate, endDate);
    console.log(form);
    getOldCartID(form, uid);
}

function addFormDataToDatabase(form, cartID) {
    fetch(`${apiURLSubmitForm}${form.name}&${form.address}&${form.city}&${form.state}&${form.zip}&${form.signature}&${form.startDate}&${form.endDate}&${cartID}`).then(
        response => response.json()
    ).then((data) => {
        console.log("Updated Rental!");
    });
}

function getOldCartID(form, uid) {
    console.log("uid is =" + uid);
    fetch(apiURLCart + uid).then(
        response => response.json()
    ).then((data) => {
        addFormDataToDatabase(form, data[0][0]);
    });
}

rhit.Form = class {
    constructor(name, email, phone, idNum, zip, state, city, address, items, quantities, signature, signDate, price, startDate, endDate) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.idNum = idNum;
        this.zip = zip;
        this.state = state;
        this.address = address;
        this.items = items;
        this.signature = signature;
        this.price = price;
        this.quantities = quantities;
        this.signDate = signDate;
        this.startDate = startDate;
        this.endDate = endDate;
        this.city = city;
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
        console.log("here, ", data);
        if (data.length != 0) {

            document.querySelector("#checkOutButton").style.display = "none";
            document.querySelector("#execPendingRentals").style.display = "initial";
            document.querySelector("#execInventory").style.display = "initial";
            document.querySelector("#addButton").style.display = "none";
            document.querySelector("#execPendingRentals").onclick = (params) => {

                document.querySelector("#addButton").style.display = "none";
                document.querySelector(".search-container").style.display = "none";
                //load pending rentals
                loadPending();

                console.log("finished");
            }
        }
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
function search(isManagement) {
    let searchword = document.querySelector("#search").value;
    console.log(searchword);
    loadEntries(searchword, isManagement);
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

function removeItemFromRental(itemID, rentalID) {
    fetch(apiURLCartRemove + rentalID + "&" + itemID).then(
        response => response.json()
    ).then((data) => {
        loadRentalItems(rentalID);
    });
}

function loadEntries(string, isManagement) {
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
            newCard.querySelector(".inventory-listitem").innerHTML = data[i][3] + ", $" + data[i][2];
            //define the interior structure for the description and set it to the item's description
            let interiorCard = interiorTemplate.content.cloneNode(true);
            interiorCard.querySelector(".description").innerHTML = data[i][4];

            //appent the interior card to the list item
            newCard.querySelector(".inventory-listitem").append(interiorCard);

            //used to set buttons and their actions
            (function (i) {
                var id = data[i][0];
                if (isManagement) {
                    var editButton = newCard.querySelector(".detail");
                    editButton.innerHTML = "EDIT";
                    var deleteButton = newCard.querySelector(".rent");
                    deleteButton.innerHTML = "DELETE";

                    console.log("is management");

                    editButton.onclick = (event) => {
                       $("#addItemDialog").modal("show");
                       var addModal = document.querySelector("#addItemDialog");
                       populateEditModal(id, addModal);
                       addModal.querySelector(".modal-title").innerHTML = "Edit Item";
                       addModal.querySelector("#addSaveButton").onclick = (event) => {
                           getModalValues(false, id);
                           loadEntries("", true);
                       }
                        console.log("edit clicked");
                    }
                    deleteButton.onclick = (event) => {
                        console.log("delete clicked");
                        deleteItem(id);
                    }
                } else {
                    newCard.querySelector(".rent").onclick = (event) => {
                        console.log("Needs to add item to Rental");
                        addItemToRental(id);
                    }
                }
            })(i);

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

function populateEditModal(id, modal){
    fetch(apiURLItem+id).then(
        response => response.json()
    ).then((data) => {
        console.log("modal data: ", data);
        modal.querySelector("#inputName").value = data[0][3];
        modal.querySelector("#inputCategory").value = data[0][5];
        modal.querySelector("#inputPrice").value = data[0][2];
        modal.querySelector("#descriptionInput").value = data[0][4];
        modal.querySelector("#inputQuantity").value = data[0][1];
    });
}

function deleteItem(itemID) {
    console.log("in delete item");
    fetch(apiURLDelete + itemID).then(
        response => response.json()
    ).then((data) => {
        loadEntries("", true);
    });
}

function addItemToRental(itemID) {
    console.log("uid is =" + uid);
    fetch(apiURLCart + uid).then(
        response => response.json()
    ).then((data) => {
        if (data.length == 0) {
            makeCart(itemID, uid);
        } else {
            console.log("add item to rental " + data);
            //addToCart(itemID, data[0][0]); //use this when username/id is fixed
            addToCart(itemID, data);
        }
    });
}

function makeCart(itemID, uid) {
    fetch(apiURLMakeCart + uid).then(
        response => response.json()
    ).then((data) => {
        console.log("make cart" + data);
        addToCart(itemID, data.ID);
    });
}

function addToCart(itemID, cartID) {
    console.log("addtocart");
    fetch(apiURLAddToCart + cartID + "&" + itemID).then(
        response => response.json()
    ).then((data) => {
        console.log("after add data = " + data);
    });
}

//Fix scrolling issues: https://www.w3schools.com/howto/howto_js_sticky_header.asp
// When the user scrolls the page, execute myFunction
window.onscroll = function () {
    var header = document.querySelector(".navbar");
    if (header) {
        var sticky = header.offsetTop;
        scrollFct(sticky, header);
    } else {
        var header = document.querySelector("#navbar");
        if (header) {
            var sticky = header.offsetTop;
            scrollFct(sticky, header);
        }
    }

};

// Get the header

// Get the offset position of the navbar


// Add the sticky class to the header when you reach its scroll position. Remove "sticky" when you leave the scroll position
function scrollFct(sticky, header) {
    if (window.pageYOffset > sticky) {
        header.classList.add("sticky");
    } else {
        header.classList.remove("sticky");
    }
}

main();