const mongoose = require("mongoose").set('debug',true);

//setting up schema to provide structure to our data
const helloEntrySchema = new mongoose.Schema({
    name: String,
    count: Number
});

const HelloEntry = mongoose.model('HelloEntry', helloEntrySchema, 'helloentry');
module.exports = HelloEntry;