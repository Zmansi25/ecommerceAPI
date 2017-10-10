var mongoose = require('mongoose');
var express = require('express');

// express router // used to define routes 
var proRouter = express.Router();
var productModel = mongoose.model('Product');
var responseGenerator = require('./../../libs/responseGenerator');
var auth = require("./../../middlewares/auth");

module.exports.controller = function (app) {

  //api to create products
  proRouter.post('/create', auth.checkLogin, function (req, res) {
    if (req.body.productName != undefined && req.body.price != undefined && req.body.stockStatus != undefined) {
      var newProduct = new productModel({
        productName: req.body.productName,
        productDetails: req.body.productDetails,
        brand: req.body.brand,
        category: req.body.category,
        stockStatus: req.body.stockStatus,
        price: req.body.price,
        offers: req.body.offers,
        seller: req.body.seller

      });
      var today = Date.now();
      newProduct.createdOn = today;
      newProduct.save(function (err) {
        if (err) {
          console.log("error");
          var myResponse = responseGenerator.generate(true, "Couldn't create product.", 500, null);
          res.send(myResponse);
        }
        else {
          var myResponse = responseGenerator.generate(false, "successfully created a product", 200, newProduct);
          res.send(myResponse);
        }
      });

    }
    else {
      var myResponse = responseGenerator.generate(true, "Some body parameter is missing", 403, null);
      res.send(myResponse);
    }
  });

  //api to get all products
  proRouter.get('/all', function (req, res) {
    productModel.find({}, function (err, allProducts) {
      if (err) {
        res.send(err);
      }
      else {
        res.send(allProducts);
      }

    });
  });

  //api to get details of specific product
  proRouter.get('/product/:id', function (req, res) {
    productModel.findOne({'_id': req.params.id}, function (err, result) {
      if (err) {
      	myResponse=responseGenerator.generate(true,"Can't find the product",404,null);
        res.send(myResponse);
      }
      else {
      	myResponse=responseGenerator.generate(false,"found product",200,result);
        res.send(myResponse);
      }

    });
  });

  //api to update the product info
  proRouter.put('/product/:id/edit', auth.checkLogin, function (req, res) {
    var update = req.body;
    console.log(update);
    productModel.findOneAndUpdate({'_id': req.params.id}, update, function (err, result) {
      if (err) {
      	myResponse=responseGenerator.generate(true,"update failed product not found",404,null);
        res.send(myResponse);
      }
      else {
      	myResponse=responseGenerator.generate(false,"found product",200,result);
        res.send(myResponse);
      }
    });
  });

  //api to delete a product
  proRouter.post('/product/:id/delete', auth.checkLogin, function (req, res) {
    productModel.remove({'_id': req.params.id}, function (err, result) {
      if (err) {
      	myResponse=responseGenerator.generate(true,"product couldn't be deleted",404,null);
        res.send(myResponse);
      }
      else {
      	myResponse=responseGenerator.generate(false,"product deleted",200,result);
        res.send(myResponse);
      }

    });
  });
  
  app.use('/products', proRouter);


}