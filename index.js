const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const $ = require("cheerio");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const app = express();

app.use(bodyParser.json())
app.get("/api/getfldetails",async (req,res)=>{
    let lap = req.query.name;
    let response = await axios.get(`https://www.flipkart.com/search?q=${lap}`)
    let data = response.data;
    let searchRes = $(".Zhf2z-",data).toArray();
    let url = searchRes[0].attribs.href;
    let newResponse = await axios.get(`https://www.flipkart.com${url}`)
    data = newResponse.data;
    let title = $("._3-wDH3",data).toArray()
    let info = $("._3YhLQA",data).toArray();
    let toSend = {}
    for(let i = 0;i<info.length;i++){
        toSend[i.toString()] = {title: $(title[i]).text(),info: $(info[i]).text()}
    }
    res.send(toSend);
})
app.get("/api/getpdetails",async (req,res)=>{
    let phone = req.query.name;
    let newPhone = "";
    for(let i = 0;i<phone.length;i++){
        if(phone[i]=="("){break;}
        newPhone+=phone[i];
    }
    newPhone = newPhone.toLowerCase();
    let response = await axios.get(`https://www.gsmarena.com/res.php3?sSearch=${newPhone}`);
    let data = response.data;
    let parsedData = $(".makers a",data).toArray();
    let names = [];
    let urls = [];
    parsedData.forEach(element=>{
        names.push($(element).text().toLowerCase())
        urls.push(element.attribs.href);
    })
    let maxIndex = 0;
    let maxClosest = 0;
    names.forEach((element,index)=>{
        let closest = 0;
        for(let i = 0;i<element.length;i++){
            if(element[i] == newPhone[i]){closest++;}
            else if(maxClosest < closest){
                maxIndex = index;
                maxClosest = closest;
                break;
            }
        }
    })
    let url = urls[maxIndex];
    let newResponse = await axios.get(`https://www.gsmarena.com/${url}`);
    let newData = newResponse.data;
    let toSend = {};
    let info = $(".nfo",newData).toArray();
    let title = $(".ttl",newData).toArray();
    for(let i = 0;i<info.length;i++){
        toSend[i.toString()] = {title: $(title[i]).text(),info: $(info[i]).text()}
    }
    res.send(toSend);
})
app.get("/api/getflap",async (req,res)=>{
    var min = req.query.min;
    var max = req.query.max;
    let response = await axios.get(`https://www.flipkart.com/search?sid=6bo%2Cb5g&otracker=CLP_Filters&p[]=facets.price_range.from%3D${min}&p[]=facets.price_range.to%3D${max}`);
    let data = response.data;
    let names = $("._3wU53n",data).toArray();
    let price = $("._1vC4OE._2rQ-NK",data).toArray()
    var toSend = {}
    for(let i = 0;i<names.length;i++){
        toSend[i.toString()] = {name: $(names[i]).text(), price: $(price[i]).text()}
    }
    res.send(toSend)
})
app.get("/api/getalap",async (req,res)=>{
    var min = req.query.min+"00";
    var max = req.query.max+"00";
    let response = await axios.get(`https://www.amazon.in/s?bbn=1375424031&rh=n%3A976392031%2Cn%3A%21976393031%2Cn%3A1375424031%2Cp_36%3A${min}-${max}&qid=1583935135&rnid=7252027031&ref=lp_1375424031_nr_p_36_5`);
    let data = response.data;
    let names = $(".a-size-medium.a-color-base.a-text-normal",data).toArray();
    let price = $(".a-price-whole",data).toArray()
    var toSend = {}
    for(let i = 0;i<names.length;i++){
        toSend[i.toString()] = {name: $(names[i]).text(), price: $(price[i]).text()}
    }
    res.send(toSend)
})
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