/*
*	Database setup and configuration
*/

/*
*	Import dependecies. 
*/
var mongoose = require('mongoose');
var config = require('./config');

/*
*	Setup connection to the Database. 
*/
mongoose.connect(config.databaseURL);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	console.log('DB Connected')
});

/*
*	User Schema.
*/ 
var userSchema = new mongoose.Schema({
	provider: String,
	username: String,
	name: String,
	customID: String,
	oauthToken: String,
	created: String,
	profilePicture: String,
	email: String,
	phone : Number,
	addressline1 : String,
	addressline2 : String,
	zipcode : Number,
	city : String
});

/*
*	Entry Schema
*/
var entrySchema = new mongoose.Schema({
	publicID: String,
	userID: String,
	media_url: String,
	thumbnail_url : String,
	aux: String,
	votes: [String],
	title: String,
	description: String, 
	created: Date,
	type : Number,
	categories: [],
	approved : Boolean
});

/*
*	Compile the Shemas into models.
*/
var Users = mongoose.model('Users', userSchema);
var Entry = mongoose.model('Entry', entrySchema);

/*
*	Export the modesl and the database.
*/
exports.Users = Users;
exports.Entry = Entry;
exports.mongoose = mongoose;