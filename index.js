var express=require("express"),
	bodyParser=require("body-parser"),
	mongoose=require("mongoose"),
	app=express();

var nodemailer = require("nodemailer");

mongoose.connect("mongodb://localhost/enrty_management");

var entrySchema=new mongoose.Schema({
	visitorName:String,
	visitorEmail:String,
	visitorContact:Number,
	hostName:String,
	hostEmail:String,
	hostContact:Number,
	checkInTime:Date,
	checkOutTime:Date
});
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

var Entry=mongoose.model("Entry",entrySchema);

app.use(bodyParser.urlencoded({extended:true,useNewUrlParser: true}));

app.set("view engine","ejs");

var transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: authority_email, // email of the entry management authority
      pass: authority_pass // password
    }
  });

app.get("/",function(req,res){
	res.render("home");
});

app.get("/entry",function(req,res){
	res.render("entry");
});

app.get("/exit",function(req,res){
	res.render("exit");
});

app.post("/new",function(req,res){
	//as soon as visitor enters all the details
	Entry.create({
		visitorName:req.body.visitorName,
		visitorEmail:req.body.visitorEmail,
		visitorContact:req.body.visitorContact,
		hostName:req.body.hostName,
		hostEmail:req.body.hostEmail,
		hostContact:req.body.hostContact,
		checkInTime:Date.now(),
		checkOutTime:req.body.time
	},function(err,entry){
		if(err){
			console.log(err);
		}else{
			//mail and sms to host regarding visitor is sent
			var mailOptions={
    			from: auth_email ,// sender address
    			to:entry.hostEmail, // list of receivers
    			subject:"From Gate Authorities", 
    			html: "<h3>Details of the guest:</h3><p>Visitor Name:"+entry.visitorName+"</p><p>Visitor Email:"+entry.visitorEmail+"</p><p>Visitor Contact:"+entry.visitorContact+"</p>"
  			}
  			transporter.sendMail(mailOptions,function(err,info){
  				if(err){
  					console.log(err);
  				}else{
  					console.log("mail sent");
  				}
  			});

  			//to sms the host about the visitor
  			//but for that we need to make a twilio account(and its paid)
			const accountSid = 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
			const authToken = 'your_auth_token';
			const client = require('twilio')(accountSid, authToken);

			client.messages
  			.create({
     			body: 'Details of the visitor',
     			from: gate_authority,
     			to: entry.visitorContact
   			})
 			.then(message => console.log(message.sid));


			res.redirect("/");
		}
	});
});

app.post("/exit",function(req,res){
	//when a visitor checks out 
	Entry.find({visitorContact:req.body.visitorContact},function(err,entry){
		if(err){
			console.log(err);
		}else{
			entry.checkOutTime=Date.now();
			//mail regarding the deails of his visit is sent
			console.log(entry);
			var mailOptions={
    			from: auth_email ,// sender address
    			to:entry.hostEmail, // list of receivers
    			subject:"From Gate Authorities", 
    			html: "<h3>Details of your visit:</h3><p>Visitor Name:"+entry.visitorName+"</p><p>Visitor Contact:"+entry.visitorContact+"</p><p>Check in Time:"+entry.checkInTime+"</p><p>Check Out Time:"+entry.checkOutTime+"</p><p>Host Name:"+entry.hostName+"</p><p>Address Visited: Innovaccer office, Noida</p>"
  			}
  			transporter.sendMail(mailOptions,function(err,info){
  				if(err){
  					console.log(err);
  				}else{
  					console.log("mail sent");
  				}
  			});
			res.redirect("/");
		}
	})
});

app.listen(3000,function(){
	console.log("Server has started!!");
});
