var express = require('express');
var app = express();

var mongoose = require('mongoose');
methodOverride = require('method-override');

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var logger = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
// path is used the get the path of our files on the computer
var path = require ('path');


app.use(logger('dev'));
app.use(bodyParser.json({limit:'10mb',extended:true}));
app.use(bodyParser.urlencoded({limit:'10mb',extended:true}));
app.use(cookieParser());
app.use(methodOverride(function(req, res){
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
      }
}));

// initialization of session middleware 
//App level middleware
app.use(session({
  name :'myCustomCookie',
  secret: 'myAppSecret', // encryption key 
  resave: true,
  httpOnly : true,
  saveUninitialized: true,
  store: new MongoStore( {mongooseConnection : mongoose.connection ,
                          ttl : 24*60*60}),
  cookie: { secure: false }
}));

// set the templating engine 
app.set('view engine', 'jade');

//set the views folder
app.set('views',path.join(__dirname + '/app/views'));


var dbPath  = "mongodb://localhost/ecom";

// command to connect with database
db = mongoose.connect(dbPath);

mongoose.connection.once('open', function() {

	console.log("database connection open success");

});



// fs module, by default module for file management in nodejs
var fs = require('fs');

// include all our model files
fs.readdirSync('./app/models').forEach(function(file){
	// check if the file is js or not
	if(file.indexOf('.js'))
		// if it is js then include the file from that folder into our express app using require
		require('./app/models/'+file);

});// end for each

// include controllers
fs.readdirSync('./app/controllers').forEach(function(file){
	if(file.indexOf('.js')){
		// include a file as a route variable
		var route = require('./app/controllers/'+file);
		//call controller function of each file and pass your app instance to it
		route.controller(app)

	}

});//end for each


//including the auth file here
var auth = require('./middlewares/auth');

var mongoose = require('mongoose');
var userModel = mongoose.model('User');
var productModel = mongoose.model('Product');

//set the middleware as an application level middleware
//For all the requests in our application this check will be performed(hence v'll b able to know whether the user is logged in or not)
// middleware to set request user , and check which user is logged in 
//check if the user is a legitimate user
app.use(function(req , res, next){
console.log()
  // checking whether session and session.user exist or not
  if(req.session && req.session.user ){
    userModel.findOne({'email':req.session.user.email},function(err,user){

      if(user){
        /*part of advanced security
        req.user = user;
        delete req.user.password;
        (maintaining multiple variabes)*/  
        

        //updating the session information, if there would have been any updation after the creation of account
        req.session.user = user;
        req.session.user.cart = user.cart;

        //console.log(req.session.user.cart);
        delete req.session.user.password;
        delete req.session.profile;
        next();
      }
      else{
        // do nothing , because this is just to set the values
      }
    });
  }
  else{
    next();
  }
});

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send(err);
  });	

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});