const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const $ = require("cheerio");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();

let usersArray = {};
let transporter = nodemailer.createTransport({
    service: process.env.MAIL_SERVICE,
    auth: {
        user: process.env.MAIL_ID,
        pass: process.env.MAIL_PASSWORD
    }
})

let Schema = mongoose.Schema;
let userSchema = new Schema({
    email: String,
    password: String,
    lapcart: [
        {
            name: String,
            vendor: String,
            price: String
        }
    ],
    mobcart: [
        {
            name: String,
            vendor: String,
            price: String
        }
    ]
});
let User = mongoose.model("User", userSchema);
app.use(cors());

app.use(bodyParser.json());
app
const middleware = (req,res,next)=>{
    const authHeader = req.get("Authorization");
    if(!authHeader){
        return (res.send("No"))
    }
    const token = authHeader.split(" ")[1]
    if(!token || token===""){
        return (res.send("No"));
    }
    let decodedToken;
    try{
        decodedToken = jwt.verify(token,process.env.SIGNING_KEY);
    }catch(err){
        return (res.send("No"))
    }
    if(!decodedToken){
        return (res.send("No"))
    }
    req.userId = decodedToken.userId
    return next();
}
app.delete("/api/deletemobcart",middleware,async (req,res)=>{
    let toDeleteName = req.query.name;
    let toDeleteVendor = req.query.vendor;
    let id = req.userId;
    let result = await User.findOne({_id:id});
    if(result.length == 0){res.send("user does not exist")}
    else{
        let updated = [...result["mobcart"]];
        for(let i = 0;i<updated.length;i++){
            if(updated[i]["name"] == toDeleteName && updated[i]["vendor"]==toDeleteVendor){
                updated.splice(i,1);
                break;
            }
        }
        await User.updateOne({_id:id},{"$set":{
            mobcart: updated
        }})
        res.send("Value removed");
    }
})
app.get("/api/getmobcart",middleware,async (req,res)=>{
    let id = req.userId;
    let result = await User.findOne({_id: id});
    let toSend = {}
    let count = 0;
    result["mobcart"].forEach(element=>{
        toSend[count.toString()] = {name: element.name,vendor:element.vendor,price:element.price}
        count++;
    })
    res.send(toSend);
})
app.delete("/api/deletelapcart",middleware,async (req,res)=>{
    let toDeleteName = req.query.name;
    let toDeleteVendor = req.query.vendor;
    let id = req.userId;
    let result = await User.findOne({_id:id});
    if(result.length == 0){res.send("user does not exist")}
    else{
        let updated = [...result["lapcart"]];
        for(let i = 0;i<updated.length;i++){
            if(updated[i]["name"] == toDeleteName && updated[i]["vendor"]==toDeleteVendor){
                updated.splice(i,1);
                break;
            }
        }
        await User.updateOne({_id:id},{"$set":{
            lapcart: updated
        }})
        res.send("Value removed");
    }
})
app.get("/api/getlapcart",middleware,async (req,res)=>{
    let id = req.userId;
    let result = await User.findOne({_id: id});
    let toSend = {}
    let count = 0;
    result["lapcart"].forEach(element=>{
        toSend[count.toString()] = {name: element.name,vendor:element.vendor,price:element.price}
        count++;
    })
    res.send(toSend);
})
app.put("/api/addmobcart",middleware,async (req,res)=>{
        let id = req.userId;
        let details = req.body;
        let result = await User.find({_id: id});
        if(result.length == 0){res.send("User not found")}
        else{
            let updated = [...result[0]["mobcart"]];
            updated.push(details);
            await User.update({_id:id},{"$set":{
                mobcart: updated
            }})
            res.send("updated")
        }
    
})
app.put("/api/addlapcart",middleware,async (req,res)=>{
        let id = req.userId
        let details = req.body;
        let result = await User.find({_id: id});
        if(result.length == 0){res.send("User not found")}
        else{
            let updated = [...result[0]["lapcart"]];
            updated.push(details);
            await User.update({_id:id},{"$set":{
                lapcart: updated
            }})
            res.send("updated")
        }
    
})
app.post("/api/login",async (req,res)=>{
    let email = req.body["email"];
    let password = req.body["password"];
    let result = await User.find({email:email});
    if(result.length==0){
        res.send("User does not exist");
    }
    else{
        let tryLogin = await bcrypt.compare(password,result[0]["password"]);
        if(tryLogin){
            let token = jwt.sign({userId: result[0]["_id"].toString()},process.env.SIGNING_KEY,{expiresIn:"1h"});
            res.send(token);
        }
        else{
            res.send("Invalid credentials");
        }
    }
    
})

app.post("/api/register",async (req,res)=>{
    let email = req.body["email"];
    let password = req.body["password"];
    let result = await User.find({email:email});
    if(result.length != 0){
        res.send("user exists");
    }
    else{
        var otp  = 0; // container of otp
            //generate random 6 digit otp
            for(var i = 0;i<6;i++)
            {
                otp *= 10;
                otp += Math.floor(Math.random()*10);
            }
        var mail = {
            from: process.env.MAIL_ID,
            to: email,
            subject: "OTP Confirmation Product_cmp",
            text: "Copy the OTP given and paste it into the input box " + otp
        }
        await transporter.sendMail(mail);
        usersArray[email] = otp;
        res.send("otp sent")
    }
})
app.post("/api/confirmotp",async (req,res)=>{
    let email = req.body["email"];
    let password = req.body["password"];
    let otp = usersArray[email];
    let gotOtp = req.body["otp"];
    if(gotOtp == otp){
        let hash = await bcrypt.hash(password,10);
            let user = new User({
                email: email,
                password: hash,
            })
            let newUser = await user.save();
            delete usersArray[email]
            let token = jwt.sign({userId: newUser["_id"].toString()},process.env.SIGNING_KEY,{expiresIn:"1h"});
            res.send(token);
    }
    else{
        res.send("wrong otp");
    }
})
app.get("/api/getaldetails",async (req,res)=>{
    let lap = req.query.name;
    let response = await axios.get(`https://www.amazon.in/s?k=${lap}`)
    let data = response.data;
    let searchRes = $("h2 .a-link-normal",data).toArray();
    let url = searchRes[0].attribs.href;
    let newResponse = await axios.get(`https://www.amazon.in${url}`)
    data = newResponse.data;
    let title = $(".column.col1 .pdTab .label",data).toArray()
    let info = $(".column.col1 .pdTab .value",data).toArray();
    let toSend = {}
    for(let i = 0;i<info.length;i++){
        toSend[i.toString()] = {title: $(title[i]).text(),info: $(info[i]).text()}
    }
    res.send(toSend);
})
app.get("/api/getfldetails",async (req,res)=>{
    let lap = req.query.name;
    let response = await axios.get(`https://www.flipkart.com/search?q=${lap}`)
    let data = response.data;
    let searchRes = $("a[target=_blank]",data).toArray();
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
mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-d1sks.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`,{useNewUrlParser:true,useUnifiedTopology: true}).then(()=>{
    console.log("database connected");
    app.listen(4000,()=>{console.log("Listening on port 4000")})
}).catch(err=>{
    console.log(err)
})
