var mongoose = require('mongoose');
var express = require('express');
var nodemailer = require('nodemailer');
// express router // used to define routes 
var ObjectId = require('mongodb').ObjectID;
var userRouter = express.Router();
var userModel = mongoose.model('User')
var responseGenerator = require('./../../libs/responseGenerator');
var creds = require('./../../libs/credentials');
var auth = require("./../../middlewares/auth");

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 8; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}


module.exports.controller = function (app) {

  //api to sign up
  userRouter.post('/signup', function (req, res) {
    if (req.body.firstName != undefined && req.body.lastName != undefined && req.body.email != undefined && req.body.password != undefined) {

      var newUser = new userModel({
        userName: req.body.firstName + '' + req.body.lastName + Math.floor(Math.random() * 100 + 1),
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        mobileNumber: req.body.mobileNumber,
        password: req.body.password,
        address: req.body.address

      }); // end new user 

      console.log(req.body.firstName + '' + req.body.lastName + Math.floor(Math.random() * 100 + 1));
      newUser.save(function (err) {
        if (err) {
          console.log("Some error");
          var myResponse = responseGenerator.generate(true, "some error" + err, 500, null);
          //res.send(myResponse);
          res.render('error', {
            message: myResponse.message,
            error: myResponse.data
          });

        }
        else {


          //storing the  current user information in req.session, which is an app level middleware
          //hence available in the whole app
          //sessions are executed through cookies
          //later this middleware(session) will be used everywhere to check the user information
          req.session.user = newUser;
          console.log(req.session);


          var myResponse = responseGenerator.generate(false, "successfully signup user", 200, newUser);
          res.send(myResponse);

          //delete the password from the session information
          //Basic security practice
          //Hacker may have the temporary access but cannot have the permanent access
          delete req.session.user.password;
        }

      }); //end new user save


    }
    else {

      var myResponse = responseGenerator.generate(true, "Some body parameter is missing", 403, null);

      res.send(myResponse);

    }


  }); //end signup

  //api to log in
  userRouter.post('/login', function (req, res) {

    userModel.findOne({$and: [{'email': req.body.email }, {'password': req.body.password}]}, function (err, foundUser) {
      if (err) {
        var myResponse = responseGenerator.generate(true, "some error" + err, 500, null);
        res.send(myResponse);
      }
      else if (foundUser == null || foundUser == undefined || foundUser.userName == undefined) {

        var myResponse = responseGenerator.generate(true, "user not found. Check your email and password", 404, null);
        res.send(myResponse);

      }
      else {

        console.log(req.session);
        req.session.user = foundUser;

        var myResponse = responseGenerator.generate(false, "login successful", 200, foundUser);
        res.send(myResponse);
        delete req.session.user.password;

      }

    }); // end login


  });

  //api to logout.
  userRouter.get('/logout', function (req, res) {
    //Single line session destroy
    req.session.destroy(function (err) {
      if (err) {
        var myResponse = responseGenerator.generate(true, "error logging out", 500, null);
        res.send(myResponse);
      }
      else {
        var myResponse = responseGenerator.generate(false, "logged out", 200, null);
        res.send(myResponse);
      }
    });
  });

  //api to recover password
  userRouter.post('/forgotpass', function (req, res) {
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: creds.id,
        pass: creds.password
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true
    })

    userModel.findOne({'email': req.body.email}, function (err, result) {
      if (err) {
        res.send(err);
      }
      else {
        var newpass = makeid();
        var text = 'Hello! your new password: ' + newpass;
        var mailOptions = {
          from: creds.id, // sender address
          to: req.body.email, // list of receivers
          subject: 'Password Change', // Subject line
          text: text
        };
        console.log(mailOptions);
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            return console.log(error);

          }
          else {
            return console.log(info.response);
          }

        });

        //var e=emailSender(req.body.email);
        console.log(newpass);

        userModel.findOneAndUpdate({email: result.email},{$set: {password: newpass}}, function (err, pass) {
          if (err) {
            var myResponse = responseGenerator.generate(true, 'Password could not be updated', 503, null);
            res.send(myResponse);
          }
          else {

            var myResponse = responseGenerator.generate(false, "new password mailed and updated", 200, pass);
            res.send(myResponse);

          }
        });
      }
    })
  });

  //api to change password
  userRouter.post('/changepassword', function (req, res) {
    if (req.body.password && req.body.newpassword) {
      //to confirm the new password ,password and newpassword should be same
      if (req.body.password == req.body.newpassword) {
        userModel.findOneAndUpdate({'email': req.body.email},{ $set: { password: req.body.password } }, function (err, pass) {
          if (err) {
            var myResponse = responseGenerator.generate(true, 'Password could not be changed', 503, null);
            res.send(myResponse);
          }
          else {
            var myResponse = responseGenerator.generate(false, "password changed successfully", 200, pass);
            res.send(myResponse);
          }
        });
      }
      else {
        var myResponse = responseGenerator.generate(true, 'New password not confirmed', 401, null);
        res.send(myResponse);
      }
    }
    else {
      var myResponse = responseGenerator.generate(true, 'Both password and duppassword required', 400, null);
      res.send(myResponse);
    }
  });
  //api to get all users.
  userRouter.get('/all', function (req, res) {
    userModel.find({}, function (err, allUsers) {
      if (err) {
        res.send(err);
      }
      else {

        res.send(allUsers);

      }

    }); //end user model find 

  }); //end get all users    


  //api to add items in cart
  userRouter.post('/addToCart', auth.checkLogin, function (req, res) {
    userModel.findOne({'email': req.body.email}, function (err, user) {
      if (req.body.prodID) {
        var pid = ObjectId(req.body.prodID);
        user.cart.push(pid);
        user.save(function (err) {
          if (err) {
            console.log("error");
            var myResponse = responseGenerator.generate(true, "some error occured.", 500, null);
            rees.send(myResponse);
          }
          else {
            var myResponse = responseGenerator.generate(false, "saved", 200, user.cart);
            res.send(myResponse);
          }
        });
      }
      else {
        var myResponse = responseGenerator.generate(true, "Some body parameter is missing", 403, null);
        res.send(myResponse);

      }
    });
  });

  //api to get the individual users cart.
  userRouter.get('/cart/:id', auth.checkLogin, function (req, res) {
    userModel.findOne({'_id': req.params.id}, function (err, result) {
      if (err) {
        res.send(err);
      }
      else {
        var myResponse = responseGenerator.generate(false, "cart fetched", 200, result.cart);
        res.send(myResponse);
      }
    });
  });

  //api to remove item from the cart.
  userRouter.post('/removeitem', auth.checkLogin, function (req, res) {
    userModel.findOne({'email': req.body.email}, function (err, user) {
      if (req.body.prodID) {
        var pid = ObjectId(req.body.prodID);
        var index = user.cart.indexOf(pid);
        if (index != -1) {
          user.cart.splice(index, 1);
        }
        user.save(function (err) {
          if (err) {
            console.log("error");
            var myResponse = responseGenerator.generate(true, "some error occured.", 500, null);
            res.send(myResponse);
          }
          else {
            var myResponse = responseGenerator.generate(false, "saved", 200, user.cart);
            res.send(myResponse);
          }
        });
      }
      else {
        var myResponse = responseGenerator.generate(true, "Some body parameter is missing", 403, null);
        res.send(myResponse);
      }
    });
  });

  //api to get number of items in a cart
  userRouter.get('/cartCount/:id', auth.checkLogin, function (req, res) {
    userModel.findOne({'_id': req.params.id}, function (err, result) {
      if (err) {
        res.send(err);
      }
      else {
        var myResponse = responseGenerator.generate(false, "cart fetched", 200, result.cart.length);
        res.send(myResponse);
      }
    });
  });


  // this should be the last line
  // now making it global to app using a middleware
  // think of this as naming your api 
  app.use('/users', userRouter);


} //end contoller code