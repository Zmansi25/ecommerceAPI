
// defining a mongoose schema 
// including the module
var mongoose = require('mongoose');
var Product = require('./Product');
// declare schema object.

var Schema = mongoose.Schema;

var userSchema = new Schema({

    userName            : {type:String,default:'',required:true,const:true},
	firstName  			: {type:String,default:''},
	lastName  			: {type:String,default:''},
	email	  			: {type:String,default:'',required:true},
	password			: {type:String,default:''},
    address  			: {type :String,default:''},
    mobileNumber  		: {type:Number,default:''},
    cart                : [{
                            type: Schema.Types.ObjectId,
                            ref:'Product'
                          }],
    itemCount           : {type:Number}

});

mongoose.model('User',userSchema);