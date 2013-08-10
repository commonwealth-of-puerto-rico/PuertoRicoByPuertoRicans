/*
*	Import Dependencies. 
*/

var db = require('../utilities/database');
var fs = require('fs');

/*
*	Render 'queSomos' view
*/
var quesomos = function(req,res){
	var currentFile = {};
	if(req.isAuthenticated()){
		currentFile.authentification = true;
	}
	res.render('quesomos', currentFile);
}

/*
* 	Render the view prior to authentification,
* 	if no prior view, render the gallery
*/
var home = function(req, res, next){
	if(req.session.returnTo){
		res.redirect(req.session.returnTo);
	}
	else{
		res.redirect('/galeria');
	}
}

/*
* 	Render the main view, containing all entries.
*/
var index = function(req, res, next){
	res.render('index');
}
/*
*	Render the main view, with no introduction. 
*/
var gallery = function(req, res, next){
	var content = { 
		'content' : [],
		'authentification' : false,
		'username' : ''
	};

	db.Entry.find({approved:true}, 'media_url title description type categories votes publicID created thumbnail_url approved aux').sort({'created':-1}).limit(20).exec(function(err, doc){
		if(err){
			console.log(err);
		}  

		//Construct  the JSON that will be sent to the view
		for(var i = 0; i < doc.length; i++){
			if(doc[i].thumbnail_url.indexOf('/uploads/') === 0){
				var aux = doc[i].thumbnail_url.split('/');
				doc[i].thumbnail_url = "https://s3.amazonaws.com/prbyprs/thumbnails/"+doc[i].publicID+".jpeg";
				doc[i].media_url = "https://s3.amazonaws.com/prbyprs/images/"+doc[i].publicID+".jpeg";
			}
			else if(doc[i].type == 7){
				doc[i].thumbnail_url = doc[i].thumbnail_url.replace(/medium/,'small');
			}
			content.content.push(doc[i]);
		}
		if(req.isAuthenticated()){
			content.authentification = true;
			content.username = req.user.name;
			res.render('gallery', content);
		}
		else{
			res.render('gallery', content);
		}
	});
}

/*
*	Get a specifict entry and render it as a single view. 
*/
var getPage = function(req,res,next){
	var content = { 
		'content' : [],
		'authentification' : false,
		'username' : ''
	};
	
	db.Entry.find({approved:true}, 'media_url title description type categories votes publicID created thumbnail_url approved aux').skip(req.params.pageNumber*20).sort({'created':-1}).limit(20).exec(function(err, doc){
		if(err){
			res.send(200);		
			next();
			console.log(err);
		}  
		//Construct  the JSON that will be sent to the view
		for(var i = 0; i < doc.length; i++){
			if(doc[i].thumbnail_url.indexOf('/uploads/') === 0){
				var aux = doc[i].thumbnail_url.split('/');
				doc[i].thumbnail_url = "https://s3.amazonaws.com/prbyprs/thumbnails/"+doc[i].publicID+".jpeg";
				doc[i].media_url = "https://s3.amazonaws.com/prbyprs/images/"+doc[i].publicID+".jpeg";
			}
			else if(doc[i].type == 7){
				doc[i].thumbnail_url = doc[i].thumbnail_url.replace(/medium/,'small');
			}
			content.content.push(doc[i]);
		}
		res.render('scrollContent', content);
	})
}

/*
*	Sort entries by category. 
*/
var categorySort = function(req, res, next){
	var requestedCategory = parseInt(req.params.category);
	var content = { 
		'content' : [],
		'authentification' : false,
		'username' : '',
		'color' : requestedCategory
	};
	
	if(requestedCategory > 0 && requestedCategory < 14){
		db.Entry.find({categories:requestedCategory, approved:true}, 'media_url title description type categories votes publicID created thumbnail_url approved aux').sort({'created':-1}).limit(10).exec(function(err, doc){
				if(err){
					console.log(err);
				}  

				for(var i = 0; i < doc.length; i++){
					if(doc[i].approved){
						if(doc[i].thumbnail_url.indexOf('/uploads/') === 0){
							var aux = doc[i].thumbnail_url.split('/');
							doc[i].thumbnail_url = "https://s3.amazonaws.com/prbyprs/thumbnails/"+doc[i].publicID+".jpeg";
							doc[i].media_url = "https://s3.amazonaws.com/prbyprs/images/"+doc[i].publicID+".jpeg";
						}
						else if(doc[i].type == 7){
							doc[i].thumbnail_url = doc[i].thumbnail_url.replace(/medium/,'small');
						}
						content.content.push(doc[i]);
					}
				}
				 if(req.isAuthenticated()){
					content.authentification = true;
					content.username = req.user.name;
					res.render('sortGallery', content);
				}
				else{
					res.render('sortGallery', content);

				}
		});
	}
	else{
		res.json(404);
	}
}

/*
*	Render the 'gallery' view,
*	Filtering out by categories. 
*/
var getcatPage = function(req,res,next){
	var requestedCategory = parseInt(req.params.cat);
	var content = { 
		'content' : [],
		'authentification' : false,
		'username' : '',
		'color' : requestedCategory
	};
	if(requestedCategory > 0 && requestedCategory < 14){
		db.Entry.find({categories:requestedCategory, approved:true}, 'media_url title description type categories votes publicID created thumbnail_url approved aux').skip(req.params.pageNumber*10).sort({'created':-1}).limit(10).exec(function(err, doc){

			if(err){
				res.send(400);		
				next();
				console.log(err);
			}  
			else{
				if(!doc[0])
					res.send(400);
				else{
					for(var i = 0; i < doc.length; i++){
						if(doc[i].approved){
							if(doc[i].thumbnail_url.indexOf('/uploads/') === 0){
								var aux = doc[i].thumbnail_url.split('/');
								doc[i].thumbnail_url = "https://s3.amazonaws.com/prbyprs/thumbnails/"+doc[i].publicID+".jpeg";
								doc[i].media_url = "https://s3.amazonaws.com/prbyprs/images/"+doc[i].publicID+".jpeg";
							}
							else if(doc[i].type == 7){
								doc[i].thumbnail_url = doc[i].thumbnail_url.replace(/medium/,'small');
							}
							content.content.push(doc[i]);
						}
					}
					res.render('sortScroll', content);	
				}		
				
			} 
		})
	}
	else{
		res.json(406);
	}
}
/*
* 	Render a single entry
* 	entry will be selected by the publicID in the URL
*/
var singleView = function(req, res, next){
	var data = {
		'entry':'',
		'user':'',
		'authentification':false
	}
	db.Entry.findOne({'publicID' : req.params.publicID}, 'media_url title description type categories aux votes publicID userID created thumbnail_url approved', function(err, entry){
		if(err) 
			return next(err);   //SECURITY ISSUE HERE
		else if(!entry || !entry.approved){
			res.redirect('/galeria');
		}
		else if(entry.approved){
			data.entry=entry;
			if(data.entry.thumbnail_url.indexOf('/uploads/') === 0){
				var aux = data.entry.thumbnail_url.split('/');
				data.entry.thumbnail_url = "https://s3.amazonaws.com/prbyprs/thumbnails/"+data.entry.publicID+".jpeg";
				data.entry.media_url = "https://s3.amazonaws.com/prbyprs/images/"+data.entry.publicID+".jpeg";
			}
			db.Users.findOne({'customID':data.entry.userID}).exec(function(err,currentUser){
				data.user = currentUser;
				if(req.isAuthenticated()){
					if(data.entry.votes.indexOf(req.user.customID) > -1){
						data.voted = true;
					}
					data.authentification = true;
				}
				//console.log(data);
				res.render('singleView', data);
			})
		}	
	})
}


var voteCount = function(req, res, next){
	db.Entry.findOne({'publicID':req.params.publicID}, 'votes approved', function(err,doc){
		if(err) 
			return next(err);   //SECURITY ISSUE HERE
		else if(!doc){
			res.redirect('/galeria');
		}
		else if(doc.approved){
			var votes = ""+doc.votes.length
			res.send(votes);
		}
		else{
			res.redirect('/galeria');
		}
	})
}

var votesPerUser = function(req,res,next){
	if(req.isAuthenticated()){
		db.Entry.find({'votes':req.user.customID}, 'publicID', function(err, doc){
			if(err){
				console.log(err);
				res.send(204);
			}
			else{
				var result = [];
				for(var i = 0; i<doc.length; i++){
					result.push(doc[i].publicID);
				}
				res.send(result);
			}
		})
	}
	else{
		res.send(204);
	}
}

/*
*	Render the 'Terms and Conditions' view.
*/
var terms = function(req,res,next){
	res.render('terms');
}

/*
*	Get the next entry and display as a preview. 
*/
var getNext = function(req,res,next){
	console.log('Current:'+req.params.publicID);
	db.Entry.findOne({'publicID':req.params.publicID}, 'created', function(err, date){
		db.Entry.find().where('created').gt(date.created).sort({created:1}).limit(1).exec(function(err, entry){
			if(err)
				console.log(err);
			else{
				var next;
				if(entry.length != 0){
					next = ''+entry[0].publicID;
				}
				else{
					next = req.params.publicID;
				}
				res.send(next);
			}
		})
	})
}

/*
*	Get the previous entry and display it's preview.
*/
var getPrev = function(req,res,next){
	console.log('Current:'+req.params.publicID);
	db.Entry.findOne({'publicID':req.params.publicID}, 'created', function(err, date){
		db.Entry.find().where('created').lt(date.created).sort({created:-1}).limit(1).exec(function(err, entry){
			if(err){
				console.log(err);
			}else{
				var prev;
				if(entry.length != 0){
					prev = ''+entry[0].publicID;
				}
				else{
					prev = req.params.publicID;
				}
				res.send(prev);
			}
		})
	})
}

/*
*	Render the video content. 
*/
var video = function(req,res,next){
	res.render('video');
}

/*
*	Render the 'Gracias' view.
*/
var gracias = function(req,res,next){
	if(req.isAuthenticated()){
		res.render('gracias');
	}
	else{
		res.redirect('/galeria');
	}
}

/*
*	Sort entries by the amount of votes
* 	in a descending fashion. 
*/
var voteSort = function(req,res,next){
	var content = { 
		'content' : [],
		'authentification' : false,
		'username' : ''
	};

	db.Entry.find({approved:true}, 'media_url title description type categories votes publicID created thumbnail_url approved aux').exec(function(err, doc){
		if(err){
			console.log(err);
		}

		var tempDocs = [];

		for(var i = 0; i< doc.length;i++){
			data = {}
			if(doc[i].thumbnail_url.indexOf('/uploads/') === 0){
				var aux = doc[i].thumbnail_url.split('/');
				data.thumbnail_url = "https://s3.amazonaws.com/prbyprs/thumbnails/"+doc[i].publicID+".jpeg";
				data.media_url = "https://s3.amazonaws.com/prbyprs/images/"+doc[i].publicID+".jpeg";
			}
			else{
				data.media_url = doc[i].media_url;
				data.thumbnail_url = doc[i].thumbnail_url;
			}
			data.voteCount = doc[i].votes.length;
			data.title = doc[i].title;
			data.description = doc[i].description;
			data.type = doc[i].type;
			data.categories = doc[i].categories;
			data.publicID = doc[i].publicID;
			data.created = doc[i].created;
			data.approved = doc[i].approved;
			data.aux = doc[i].aux;
			data.votes = doc[i].votes;

			tempDocs.push(data);

		}

		function predicatBy(prop){
			return function(a,b){
				if( a[prop] > b[prop]){
					return 1;
				}else if( a[prop] < b[prop] ){
					return -1;
				}
				return 0;
			}
		}
		
		tempDocs.sort(predicatBy("voteCount"));
		tempDocs = tempDocs.reverse();
		tempDocs = tempDocs.slice(0,10);
		
		var content = { 
			'content' : tempDocs,
			'authentification' : false,
			'username' : ''
		};

		if(req.isAuthenticated()){
			content.authentification = true;
			content.username = req.user.name;
			res.render('favGallery', content);
		}
		res.render('favGallery', content);
	});
}

/*
*	Render the favorite entries page. 
*/
var favpage = function(req,res,next){
	var currentPage = parseInt(req.params.favpage)
	if(currentPage >= 5){
		res.send(404);
	}
	else{
		var content = { 
			'content' : [],
			'authentification' : false,
			'username' : ''
			};

		db.Entry.find({approved:true}, 'media_url title description type categories votes publicID created thumbnail_url approved aux').exec(function(err, doc){
			if(err){
				console.log(err);
			}

			var tempDocs = [];

			for(var i = 0; i< doc.length;i++){
				data = {}
				if(doc[i].thumbnail_url.indexOf('/uploads/') === 0){
					var aux = doc[i].thumbnail_url.split('/');
					data.thumbnail_url = "https://s3.amazonaws.com/prbyprs/thumbnails/"+doc[i].publicID+".jpeg";
					data.media_url = "https://s3.amazonaws.com/prbyprs/images/"+doc[i].publicID+".jpeg";
				}
				else{
					data.media_url = doc[i].media_url;
					data.thumbnail_url = doc[i].thumbnail_url;
				}
				data.voteCount = doc[i].votes.length;
				data.title = doc[i].title;
				data.description = doc[i].description;
				data.type = doc[i].type;
				data.categories = doc[i].categories;
				data.publicID = doc[i].publicID;
				data.created = doc[i].created;
				data.approved = doc[i].approved;
				data.aux = doc[i].aux;
				data.votes = doc[i].votes;

				tempDocs.push(data);
				
			}

			function predicatBy(prop){
				return function(a,b){
					if( a[prop] > b[prop]){
						return 1;
					}else if( a[prop] < b[prop] ){
						return -1;
					}
					return 0;
				}
			}
			
			tempDocs.sort(predicatBy("voteCount"));
			tempDocs = tempDocs.reverse();
			tempDocs = tempDocs.slice(0,50);
			tempDocs = tempDocs.slice(currentPage*10,(currentPage*10)+10);
			
			var content = { 
				'content' : tempDocs,
				'authentification' : false,
				'username' : ''
			};
			res.render('scrollContent', content);
		});
	}	
}

/*
*	Render the Robots.txt
*/
var robots = function(req, res, next)
{
	res.set('Content-Type', 'text/plain');
	var buffer = fs.readFileSync(__dirname + '/../robots.txt');
	res.send(buffer);
}

/*
*	Render the sitemap. 
*/
var sitemap = function(req, res, next)
{
	res.set('Content-Type', 'text/xml');
	var buffer = fs.readFileSync(__dirname + '/../sitemap.xml');
	res.send(buffer);
}

/*
*	Export the functions. 
*/

exports.video = video;
exports.gracias = gracias;
exports.voteCount = voteCount;
exports.votesPerUser = votesPerUser;
exports.index = index;
exports.gallery = gallery;
exports.quesomos = quesomos;
exports.singleView = singleView;
exports.home = home;
exports.terms = terms;
exports.getNext = getNext;
exports.getPrev = getPrev;
exports.getPage = getPage;
exports.cleanNull = cleanNull;
exports.robots = robots;
exports.sitemap = sitemap;
exports.categorySort = categorySort;
exports.getcatPage = getcatPage;
exports.voteSort = voteSort;
exports.favpage = favpage;

