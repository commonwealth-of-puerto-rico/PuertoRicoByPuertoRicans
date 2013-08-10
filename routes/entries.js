/*
*	Import Dependecies. 
*/

var passport = require('passport');
var crypto = require('crypto');
var fs = require('fs');
var email = require('emailjs');
var knox = require('knox');
var db = require('../utilities/database');
var config = require('../utilities/config');
var gm = require('gm');

/*
*	Sendgrid Credentials
*/
var SendGrid = require('sendgrid').SendGrid;
var sendgrid = new SendGrid(config.sendgrid.username, config.sendgrid.password);

/*
*	S3 Credentials
*/
var client = knox.createClient({
    key: config.S3.key,
    secret: config.S3.secret,
    bucket: config.S3.bucket
});

/*
*	Deserialize the current user 
* 	from the current session cookie.
*/

passport.deserializeUser(function(id, done) {
  db.Users.findById(id, function(err, user) {
    done(err, user);
  });
});

/*
* Store the user entry in the database
*/
var storeEntry = function(req, res, next){
	var now = new Date(); 
	var temp =  ''+(Math.floor(Math.random() * 10) + now.getTime());
	var fileName = ((crypto.createHash('sha1')).update(temp)).digest('hex'); 
	var listOfCategories = [];
	if(req.body.category != null){	//verificar si esta vacío
		for(var i = 0; i < req.body.category.length; i++){
			listOfCategories.push(parseInt(req.body.category[i]));
		}
	}else{
		listOfCategories.push(20);
	}
	if(req.body.url === ''){
		var imageName = req.files.img.name;
		var imgSplit = imageName.split('.');

		if(imgSplit[1].match(/jpg|jpeg/) === null){  //Verify Extension and send 402 if is not .jpeg or .jpg
			res.json(402); //invalid file type
			res.redirect('/participa');
			console.log('402');
		}	
		else{
			fs.readFile(req.files.img.path, function(err, data){ 
				//	Future: make sure upload does not exceed a limit. 


				//	Store original image (resize to 720px)
				gm(req.files.img.path).resize(1024)
				.write(__dirname + '/../public/uploads/' + fileName +'.jpeg', function (err) {
					if (err){
						console.log("flag_1");
						console.log(err);
					} 
  						
				});

				/*
				*	Create a thumbnail version of the image, store locally.
				*/
				gm(req.files.img.path).resize(320)
				.write(__dirname + '/../public/uploads/thumbnails/' + fileName +'.jpeg', function (err) {
					if (err){
						console.log("flag_2");
						console.log(err);
					} 
				});

				//Setup the name and paths for the upload for the original and thumbnail
				var originalImg = { 
					path : req.files.img.path,
					name : "images/" +fileName + ".jpeg"
				}

				var thumbnailImg = {
					path : __dirname + '/../public/uploads/thumbnails/' + fileName +'.jpeg',
					name : "thumbnails/" +fileName +'.jpeg'
				}

				//Store the images in S3
				client.putFile(originalImg.path, originalImg.name, { 'Content-Type' : 'image/jpeg','x-amz-acl' :  'public-read'}, function(err1, result1){
					if(err1){
						console.log(err)
						uploadErr = err;
					}
					else if(result1.statusCode == 200){

						client.putFile(thumbnailImg.path, thumbnailImg.name, { 'Content-Type' : 'image/jpeg','x-amz-acl' :  'public-read'}, function(err2, result2){
							if(err2){
								console.log(err);
							}
							else if(result2.statusCode == 200){
								console.log('Done uploading');

								//Upload is done, store in DB
								var entry = new db.Entry;

								entry.publicID = fileName; 
								entry.userID = req.user.customID;
								entry.media_url = '/uploads/'+fileName+'.jpeg';
								entry.thumbnail_url = '/uploads/'+thumbnailImg.name;
								entry.votes = [];
								entry.aux = '';
								entry.title = req.body.title;
								entry.description = req.body.description;
								entry.created = Date.now();
								entry.type = 1;
								entry.categories = listOfCategories;
								entry.approved = false;
								entry.save(function(err, doc){
								console.log('Entry Saved');
									if(err){
										console.log(err);
										res.redirect('/participa');
									}
									else{
										firstName = req.user.name.split(' ')[0];
										sendgrid.send({
										to:"<"+ req.user.email +">",
										from:"<info@puertoricobypuertoricans.com>",
										bcc:"<info@puertoricobypuertoricans.com>",
										subject:"Entrada Recibida",
										html: "<p>Saludos "+ firstName + ": </p><p>¡Gracias por someter <b>''"+ req.body.title + "'' </b> a Puerto Rico By Puerto Ricans y ayudar a poner a Puerto Rico en el mapa! <br></br> Tu contenido se está revisando para asegurar cumplimiento con las reglas del Concurso. <br></br><br></br> En breve recibirás un segundo correo confirmando que ha subido exitosamente.</p><br></br><br></br><img height='80px'src='http://puertoricobypuertoricans.com/img/logo.png'></img>",
										}, 
										function(success, message) {
											if (!success) {
												console.log(message);
											}
											else{res.redirect('/gracias');}
											});
									} //message
								})//
							}
						})
						
					}
				})
			})
		}
	}
	else{ //it is a URL
		var entry = new db.Entry;
		entry.publicID = fileName; 
		entry.userID = req.user.customID;
		entry.media_url = req.body.url;
		entry.thumbnail_url = req.body.thumbnail_url;
		entry.votes = [];
		entry.aux = req.body.aux;
		entry.title = req.body.title;
		entry.description = req.body.description;
		entry.created = Date.now();
		entry.type = req.body.type;
		entry.categories = listOfCategories;
		entry.approved = false;
		entry.save(function(err, doc){
			console.log('Entry Saved:URL');
			console.log(doc);
			if(err){
				console.log(err);
				res.redirect('/participa');
			}
			else{
				firstName = req.user.name.split(' ')[0];
				sendgrid.send({
					to:"<"+ req.user.email +">",
					from:"<info@puertoricobypuertoricans.com>",
					bcc:"<info@puertoricobypuertoricans.com>",
					subject:"Entrada Recibida",
					html: "<p>Saludos "+ firstName + ": </p><p>¡Gracias por someter <b>''"+ req.body.title + "'' </b> a Puerto Rico By Puerto Ricans y ayudar a poner a Puerto Rico en el mapa! <br></br> Tu contenido se está revisando para asegurar cumplimiento con las reglas del Concurso. <br></br><br></br> En breve recibirás un segundo correo confirmando que ha subido exitosamente.</p><br></br><br></br><img height='80px'src='http://puertoricobypuertoricans.com/img/logo.png'></img>",
				}, function(success, message) {
					if (!success) {
						console.log(message);
					}
					else{res.redirect('/gracias');}
				});
			} //message
		}) //save

	}
}
/*
* Voting functionality,
* first check to see if the user is logged in,
* if true, register vote and redirect to gallery
* If false, save route in session and respond with error message
* Only one vote per user.
*/
var vote = function(req, res){
	if(req.isAuthenticated()){
		db.Entry.findOne({publicID:req.params.publicID}, function(err,doc){
			if(doc.votes.indexOf(req.user.customID) === -1){
				doc.votes.push(req.user.customID);
				doc.save(function(err, doc){
					if(err){
						console.log(err);
						res.json(400);
					}
					else
						res.json(200);
				})
			}	
			else{
				res.json(406) //Don't vote twice
			}
		});
	}
	else{
			req.session.returnTo = req.body.path;
			res.json(400);
	}
}


/*
*	Export functions
*/

exports.storeEntry = storeEntry;
exports.vote = vote;

