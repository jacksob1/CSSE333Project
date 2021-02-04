apiURL = "http://localhost:4000/search/";
var defaultSearchword = "DEFAULT_SEARCH_PARAM";
var signedIn = false;

//From https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
}

function main() {
    console.log("IN MAIN\n");

    if (signedIn) {
        document.querySelector("#signin").innerHTML = "Sign Out";
        document.querySelector("#signin").onclick = (event) => {
            console.log("Sign out here");
        }
    } else {
        document.querySelector("#signin").onclick = (event) => {
            signIn();
        }
    }


    loadEntries(""); //get data and populate entries

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
        document.querySelector("#signin").textContent="Sign Out";
        document.querySelector("#signin").onclick = (event) => {
            console.log("Sign out here");
        }
        signedIn = true;

        // TODO: Use the rfUser.token with your server.
    });
}


//needs to be done (probably)
function updateView() {}


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