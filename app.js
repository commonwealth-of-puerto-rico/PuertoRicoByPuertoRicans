/*
*	Import dependecies. 
*/
var express = require('express');
var http = require('http');
var path = require('path');
var passport = require('passport'),
	FacebookStrategy = require('passport-facebook').Strategy,
	TwitterStrategy = require('passport-twitter').Strategy,
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var config = require('./utilities/config');
var db = require('./utilities/database');
var entries = require('./routes/entries');
var user = require('./routes/user');
var index = require('./routes/index');
var parser = require('./routes/parser');



/*
*	Setup and Configure PassportJS, thanks to jaredhanson
*/

//Serialize and deserialize users.
passport.serializeUser(function(user, done){
	done(null, user.id)
});

passport.deserializeUser(function(id, done){
	db.Users.findOne(id, function(err, user){
		done(err, user);
	});
});

/*
*	Setup facebook strategy.
*/
passport.use(new FacebookStrategy({
	clientID: config.facebook.id,
	clientSecret: config.facebook.secret,
	callbackURL: "/auth/facebook/callback"
	},
	function(accessToken, refreshToken, profile, done){
		db.Users.findOne({customID: 'facebook:' + profile.id}, function(err, user){
			console.log(user);
			if(user){
				done(null,user);
			}
			else{
				var newUser = new db.Users({
					provider: 'facebook',
					username: profile.username,
					name: profile.displayName,
					customID: 'facebook:' + profile.id,
					oauthToken: accessToken,
					created: Date.now(),
					profilePicture: 'http://graph.facebook.com/' + profile.id + '/picture?type=square',
					email : "",
					phone:""
				}).save(function (err, newUser){
					if(err) console.log(err);
					done(null, newUser);
				});
			}
		});
	}
));

/*
*	Setup Twitter Strategy.
*/
passport.use(new TwitterStrategy({
		consumerKey: config.twitter.key,
		consumerSecret: config.twitter.secret,
		callbackURL:"/auth/twitter/callback",
		},
		function(token, tokenSecret, profile, done){
			db.Users.findOne({customID: 'twitter:' + profile.id}, function(err, user){
				if(user){
					done(null, user);
				}
				else{
					var newUser = new db.Users({
						provider: 'twitter',
						username: profile.username,
						name: profile.displayName,
						customID: 'twitter:' + profile.id,
						oauthToken: token,
						created: Date.now(),
						profilePicture:'https://api.twitter.com/1/users/profile_image?screen_name=' + profile.username +'&size=bigger',
						email : "",
						phone:""
					}).save(function (err, newUser){
						if(err) console.log(err);
						done(null, newUser);
					});
				}
			});
		}
));

/*
*	Setup Google Strategy.
*/
passport.use(new GoogleStrategy({
	clientID: config.googleProduction.clientID,
	clientSecret : config.googleProduction.clientSecret,
	callbackURL: '/auth/google/callback'
	},
	function(token, tokenSecret, profile, done){
		db.Users.findOne({customID: 'google:' + profile.id}, function(err, user){
			if(user){
				done(null, user);
			}
			else{
				var newUser = new db.Users({
					provider: 'google',
					username: profile.username,
					name: profile.displayName,
					customID: 'google:' + profile.id,
					oauthToken: token,
					created: Date.now(),
					profilePicture: '',
					email : "",
					phone:""
				}).save(function (err, newUser){
					if(err) console.log(err);
					done(null, newUser);
				});
			}
		});
	}
));

/*
*	Initialize, set up and configure the expressJS App.
*/
var app = express();
var time = 100000;

app.configure(function(){
	app.set('port', 80);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret: config.secret}));
	app.use(express.methodOverride());
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(express.static(path.join(__dirname, 'public'),{maxAge: time}));
	app.use('/entry', express.static(__dirname + '/public'));
	app.use('/categoria', express.static(__dirname + '/public'));

	app.use(function (req, res, next) {
	    res.locals.req = req;
	    next();
	});
	app.use(app.router);

});

app.configure('development', function(){
	app.use(express.errorHandler());
});

/*
*	Define the Routes. 
*/
app.get('/', index.index);
app.get('/galeria', index.gallery);
app.get('/entrar', user.signIn);
app.get('/quesomos',index.quesomos);
app.get('/perfil', user.profile);
app.get('/entry/:publicID',index.singleView); 
app.get('/participa', user.newEntry);
app.get('/terminos', index.terms);
app.get('/comoParticipar', index.video);
app.post('/profileUpdate', user.profileUpdate);
app.post('/vote/:publicID',entries.vote);
app.post('/newentry', entries.storeEntry);

app.get('/voteCount/:publicID', index.voteCount);
app.get('/votesPerUser', index.votesPerUser);

app.get('/robots.txt', index.robots);
//app.get('/sitemap.xml', index.sitemap);

app.get('/getNext/:publicID', index.getPrev);
app.get('/getPrev/:publicID', index.getNext);
app.get('/gracias',index.gracias);

app.get('/page/:pageNumber',index.getPage);

app.get('/categoria/:category', index.categorySort)
app.get('/getcatPage/:pageNumber/:cat', index.getcatPage)

app.get('/favoritos',index.voteSort);
app.get('/favpage/:favpage',index.favpage);

//Media Backend Parsers
app.get('/instagram/:key',parser.instagram);
app.get('/pinterest/:pin',parser.pinterest);
app.get('/panoramio/:key', parser.panoramio);

//Facebook authentification
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook'), index.home);

//Twitter authentification
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter'), index.home);

//Google+ authentification
app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.profile',
											'https://www.googleapis.com/auth/userinfo.email'] }));
app.get('/auth/google/callback', passport.authenticate('google'), index.home);

//Log out
app.get('/salir', function(req, res){ req.logOut(); res.redirect('/galeria');})


app.get('/*', function(req, res, next) {
	if (req.headers.host.match(/^www/) !== null ) {
		res.redirect('http://' + req.headers.host.replace(/^www\./, '') + req.url);
	} else {
		next();     
	}
})

/*
*	Initialize the server.
*/
http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});
