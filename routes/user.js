/*
*	Handle user functions
*/	

/*
*	Import Dependecies. 
*/
var db = require('../utilities/database');
var passport = require('passport');

/*
*	Deserialize user out of session. 
*/
passport.deserializeUser(function(id, done) {
  db.Users.findById(id, function(err, user) {
    done(err, user);
  }); 
});


/*
* 	Render the user profile
*/
var profile = function(req, res, next){
	if(req.isAuthenticated()){
		db.Users.findOne({customID : req.user.customID}, function(err, user){
			db.Entry.find({userID : user.customID}, function(err,entries){
				profileData = {
					user : user,
					entries : entries
				}
				profileData.authentification = true;
				res.render('profile', profileData);
			})			
		})
	}
	else{
		req.session.returnTo = req.route.path;
		res.redirect('/entrar');
	}
}

/*
*	Update user profile information.
*/
var profileUpdate = function(req,res,next){
	if(req.isAuthenticated()){
		console.log(req.profileData);
		db.Users.findOne({customID: req.user.customID}, function(err, user){
			var phone = req.body.phone.replace(/[^\d]/g, "");
			user.email = req.body.email;
			user.phone = phone;
			user.save(function(err, data){
				if(err){
						console.log(err);
						next();
						res.json(400);
					}
				else
					res.redirect('/participa')
			})
		})
	}
}

/*
* 	Render the user settings page
*/
var userData = function(req, res, next)
{
	if(req.isAuthenticated()){
		data = {
			email : req.user.email,
			phone : req.user.phone
		}
		data.authentification = true;
		res.render('profile', data);
	}
	else{
		req.session.returnTo = req.route.path;
		res.redirect('/signin');
	}		
}

/*
*	Render 'newEntry' view
*/
var newEntry = function(req, res, next)
{
	if(req.isAuthenticated()){
		if(req.user.email === ""){
			res.redirect('/perfil');
		}
		else{
		var currentFile = {};
		currentFile.authentification = true;
		res.render('newEntry', currentFile);
		}
	}
	else{
		req.session.returnTo = req.route.path;
		res.redirect('/entrar');
	}
}

/*
* 	Render the 'Sign in' view
*/
var signIn = function(req,res){
	if(req.isAuthenticated()){
		res.redirect('/galeria');
	}
	else{
		res.render('signin');
	}
}


/*
*	Export the functions. 
*/
exports.newEntry = newEntry;
exports.signIn = signIn;
exports.profile = profile;
exports.userData = userData;
exports.profileUpdate = profileUpdate;
