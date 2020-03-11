const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const $ = require("cheerio");
const mongoose = require("mongoose");
const app = express();

app.use(bodyParser.json())

app.get("/api/get",(req,res)=>{
    res.json("hello world")
});

app.listen(4000,()=>{console.log("Listening on port 4000")})