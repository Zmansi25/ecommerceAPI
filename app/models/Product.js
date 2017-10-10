
// defining a mongoose schema 
// including the module
var mongoose = require('mongoose');
// declare schema object.
var Schema = mongoose.Schema;

var productSchema = new Schema({

	productName 	: {type:String,required:true},
	productDetails 	: {type:String,default:''},
	price 			: {type:Number,required:true},
	stockStatus 	: {type:String,required:true},
	category 		: {type:String},
	brand 			: {type:String},
	seller 			: {type:String},
	offers 			: {type:String},
	ratings			: {type:Number},
	createdOn		: {type:Date}

});

mongoose.model('Product',productSchema);	