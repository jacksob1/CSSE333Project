//const { response } = require("express");

apiURL = "http://localhost:4000/search/";
var selectedId = "";
var defaultSearchword = "DEFAULT_SEARCH_PARAM";



//From https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
}

function main() {
    console.log("IN MAIN\n");

    loadEntries(""); //get data and populate entries

    $(".search-container").keyup(function (event) {
        // if ($(".search-container").is(':focus')&& event.which === 13) {​​
        //     alert("hello");
        // }​​
        if (event.which === 13){
            let searchword = document.querySelector("#search").value;
            console.log(searchword);
            loadEntries(searchword);
        }
    });
}



function updateView() {

}

function loadEntries(string) {
    console.log("got here\n");
    if (string == ""){
        string = defaultSearchword;
    }
    $("#rentalsContainer").innerHTML = "";
    const newList = htmlToElement('<div id="rentalsContainer" class="col-md-8"></div>');
    fetch(apiURL+string).then(
        response => response.json()
    ).then((data) => {
        console.log("response??\n");
        console.log(data);
        for (var i = 0; i < data.length; i++) {
            let template = document.querySelector("#cardTemplate");
            let newCard = template.content.cloneNode(true);
            let interiorTemplate = document.querySelector("#listItemInterior");
            newCard.querySelector(".inventory-listitem").innerHTML = data[i][3];
            let interiorCard = interiorTemplate.content.cloneNode(true);
            interiorCard.querySelector(".description").innerHTML = data[i][4];
            newCard.querySelector(".inventory-listitem").append(interiorCard);
            newList.append(newCard);
        }
        console.log("finished");
    });
    //removes the old rentalsContainer and id
    const oldList = document.querySelector("#rentalsContainer");
    oldList.removeAttribute("id");
    oldList.hidden = true;
    oldList.parentElement.appendChild(newList);
}

function loadEntry(id) {
    selectedId = id;
    let entry = fetch(apiURL + "id/" + id).then(
        response => response.json()).then(data => {
        document.querySelector("#inputName").value = data.name;
        counter = data.count;
        editEntryMode = true;
        updateView();
    });
}


function createEntry() {
    let name = document.querySelector("#inputName").value;
    let data = {
        "name": name,
        "count": counter
    };

    let entry = fetch(apiURL, {
        method: "POST",
        headers: {
            "Content-Type": 'application/json'
        },
        body: JSON.stringify(data)
    }).then((data) => {
        editEntryMode = false;
        document.querySelector("#inputName").value = "";
        counter = 0;
        updateView();
        loadEntries();
    }).catch((err) => {
        console.log(err);
    });
}

function deleteEntry() {
    fetch(apiURL + "id/" + selectedId, {
        method: "DELETE"
    }).then(data => {
        editEntryMode = false;
        document.querySelector("#inputName").value = "";
        counter = 0;
        updateView();
        loadEntries();
    }).catch((err) => {
        console.log(err);
    });
}


function updateEntry() {
    let name = document.querySelector("#inputName").value;
    let data = {
        "name": name,
        "count": counter
    };
    fetch(apiURL + "id/" + selectedId, {
        method: "PUT",
        headers: {
            "Content-Type": 'application/json'
        },
        body: JSON.stringify(data)
    }).then(data => {
        editEntryMode = false;
        document.querySelector("#inputName").value = "";
        counter = 0;
        updateView();
        loadEntries();
    }).catch((err) => {
        console.log(err);
    });
}


main();