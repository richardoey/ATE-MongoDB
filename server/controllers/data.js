const mongoUtil = require("../src/mongoUtil");
const config = require('../config/config')
const db = mongoUtil.getDb()
const ate_tests = db.collection(config.DB_TEST_COLLECTION)

exports.getAll = async (req, res) => {

    try {
        // Save a new user in database
        await ate_tests.find().sort({ test_date: -1 }).toArray(function (err, result) {
            if (err) throw err;
            res.status(200).send({ 'tests': [result] })
        });
    }
    catch (err) {
        console.log('Error Find Test: ', err);
    }
}

exports.getUpdateData = async (req, res) => {

    changeStream = ate_tests.watch();
    changeStream.on("change", next => {
        // process any change event
        console.log("received a change to the collection: \t", next);
    });
}

exports.searchTest = async (req, res) => {
    const querySearch = req.params.query;
    let query = {  $or: [ { serial_number: {$regex: ".*" + querySearch + ".*"}}, { mac_address: {$regex: ".*" + querySearch + ".*"} }, { test_station: {$regex: ".*" + querySearch + ".*"}}, { result: {$regex: ".*" + querySearch.toUpperCase() + ".*"}}] };
    try {
        // search data
        await ate_tests.find(query).sort({test_date: -1}).toArray(function (err, result) {
            if (err) throw err;
            res.status(200).send({ 'tests': [result] })
        });
    }
    catch (err) {
        console.log('Error Find Test: ', err);
    }
}