//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const ejs = require("ejs");
const _=require("lodash");
const fs=require('fs');
var path=require("path");


const app = express();
var router = express.Router();

app.use(express.static('public'));
// app.use(express.static('uploads'));

 app.use("/public/uploads", express.static(path.join(__dirname, "/public/uploads")));
mongoose.connect("mongodb+srv://admin-pranav:test123@cluster0.0lkj6ty.mongodb.net/findrDB");

const multer = require('multer');
const { Console } = require("console");


app.set('view engine', 'ejs');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/');
    },
    filename: function(req,file,cb){
        cb(null,file.originalname);
    }
});

const upload = multer({ storage: storage });


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true,"Name missing"]
    },
    rollno: {
        type: String,
        required: [true,"Roll no. missing"]
    },
    contact: {
        type: String,
        required: [true,("Contact no. missing")]
    },
    email: {
        type: String,
        required: [true,"emailID missing"]
    },
    pwd: {
        type: String,
        required: [true,"Password missing"]
    }
   
   });
const User = mongoose.model("User", userSchema);

const lostSchema=new mongoose.Schema({
    name: String,
    item: String,
    addDate: String,
    lostDate: String,
    img: String,
    desc: String
});
const Lost = mongoose.model("Lost", lostSchema);

const foundSchema= new mongoose.Schema({
    name: String,
    item: String,
    addDate: String,
    foundDate: String,
    returned: String,
    foundat: String,
    img: String,
    desc: String
});
const Found=mongoose.model("Found",foundSchema);

const historySchema=new mongoose.Schema({
    addname: String,
    item: String,
    addDate: String,
    removeDate: String,
    removereason: String,
    removename: String,
    img: Buffer,
    desc: String
});
const History=mongoose.model("History",historySchema);

app.get("/",function(req,res){
    res.render("home");
});
app.post("/signup",function(req,res){
    
    const user=new User({
         name: req.body.name,
         rollno: req.body.rollno,
         contact: req.body.contact,
         email: req.body.emailID,
         pwd: req.body.password
    });
    user.save();
    res.redirect("/");
});
app.post("/login",function(req,res){
    console.log(req.body.email);
    console.log(req.body.password);
    User.findOne({email: req.body.email},function(err,result){
        if(!err){
            if(req.body.password===result.pwd){
                //console.log(result);
                res.redirect("/"+result.name);
            }
        }
        else console.log(err);
    });
});
app.get("/:username",function(req,res){
    var litems=[];
    var fitems=[];
    var username=_.trimEnd(req.params.username);
    Lost.find({},function(err,result){
        litems=result;
        Found.find({},function(err,result2){
            fitems=result2;
            History.find({},function(err,result3){
                history=result3;
                res.render("profile",{username: username,litems:litems,fitems:fitems,history: history});
            });
            
        });
     
    });
});

app.post("/:username/addLost",upload.single('image'),function(req,res){
    const username=_.trimEnd(req.params.username);
 
    var date = new Date();
    const pathName=req.file.path;
    console.log(pathName);
 
    date=(date.toISOString().slice(0,10));
    const lost=new Lost ({
        name: username,
        item: req.body.name,
        addDate: date,
        lostDate: req.body.lostDate,
        img: pathName,
        desc: req.body.desc
    });

    lost.save();

   
    res.redirect("/"+_.trimEnd(username));
});

app.post("/:username/addFound",upload.single('image'),function(req,res){
    const username=_.trimEnd(req.params.username);
    var date = new Date();
   
    const pathName=req.file.path;

    date=(date.toISOString().slice(0,10));
    const found=new Found ({
        name: username,
        item: req.body.name,
        addDate: date,
        foundDate: date,
        returned: req.body.returnedTo,
        foundat: req.body.foundAt,
        img: pathName,
        desc: req.body.desc
    });
    found.save();
    res.redirect("/"+_.trimEnd(username));
});
app.post("/:username/lost/:_id",upload.single('image'),function(req,res){
    const username=_.trimEnd(req.params.username);
    const customID=req.params._id;
    Lost.find({_id:customID},function(err,result){
            User.find({name: username},function(err,result3){
                res.render("l_item",{item:result[0],user:result3[0],username:username});
                //console.log(result3);
            });
    });
});

app.post("/:username/found/:_id",function(req,res){
    const username=_.trimEnd(req.params.username);
    const customID=req.params._id;
    Found.find({_id:customID},function(err,result2){
        User.find({name: username},function(err,result3){
            res.render("f_item",{item:result2[0],user:result3[0],username:username});
            //console.log(result2,result3);
            });
    });
});
app.post("/:username/:_id/remove",function(req,res){
    const username=_.trimEnd(req.params.username);
    const customID=req.params._id;
    var date = new Date();
    date=(date.toISOString().slice(0,10));
 
    Lost.findOneAndDelete({_id:customID},function(err,result){
     
        const history= new History({
            addname: result.name,
            item: result.item,
            addDate: result.addDate,
            removeDate: date,
            removereason: "Removed lost item",
            removename: username,
            img: result.img,
            desc: result.desc
        });
        history.save();
    });
    res.redirect("/"+_.trimEnd(username));
 
});

app.post("/:username/:_id/claim",function(req,res){
    const username=_.trimEnd(req.params.username);
    const customID=req.params._id;
    var date = new Date();
    date=(date.toISOString().slice(0,10));
    //console.log(customID);
    Found.findOneAndDelete({_id:customID},function(err,result){
        //console.log(result);
        const history= new History({
            addname: result.name,
            item: result.item,
            addDate: result.addDate,
            removeDate: date,
            removereason: "Claimed found item",
            removename: username,
            img: result.img,
            desc: result.desc
        });
        history.save();
    });
    res.redirect("/"+_.trimEnd(username));
 
});








app.listen(3000, function() {
    console.log("Server started on port 3000");
  });