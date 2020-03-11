const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const $ = require("cheerio");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const app = express();

app.use(bodyParser.json())

app.get("/api/getfphone",async (req,res)=>{
    var min = req.query.min;
    var max = req.query.max;
    let response = await axios.get(`https://www.flipkart.com/search?sid=tyy%2C4io&otracker=CLP_Filters&p%5B%5D=facets.price_range.from%3D${min}&p%5B%5D=facets.price_range.to%3D${max}`);
    let data = response.data;
    let names = $("._3wU53n",data).toArray();
    let price = $("._1vC4OE._2rQ-NK",data).toArray()
    var toSend = {}
    for(let i = 0;i<names.length;i++){
        toSend[i.toString()] = {name: $(names[i]).text(), price: $(price[i]).text()}
    }
    res.send(toSend)
});
app.get("/api/getaphone",async(req,res)=>{
    var min = req.query.min+"00";
    var max = req.query.max+"00";
    let response = await axios.get(`https://www.amazon.in/s?i=electronics&bbn=1389401031&rh=n%3A976419031%2Cn%3A976420031%2Cn%3A1389401031%2Cp_36%3A${min}-${max}&dc&fst=as%3Aoff&qid=1583933920&rnid=1318502031&ref=sr_nr_p_36_1`)
    let data = response.data;
    let names = $(".a-size-medium.a-color-base.a-text-normal",data).toArray();
    let price = $(".a-price-whole",data).toArray();
    var toSend = {}
    for (let i = 0;i<names.length;i++){
        toSend[i.toString()] = {name: $(names[i]).text(), price: $(price[i]).text()}
    }
    res.send(toSend);
})
app.listen(4000,()=>{console.log("Listening on port 4000")})