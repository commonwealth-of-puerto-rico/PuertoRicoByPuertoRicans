/*
*	Import Dependecies.
*/
var jsdom = require("jsdom");

/*
*	Get content from Instagram.	
*/
var instagram = function(req,res){
	console.log(req.params.key);
	jsdom.env({
		html:"http://instagram.com/p/"+req.params.key,
		scripts: ["http://code.jquery.com/jquery.js"],
		done: function(err, window){
			console.log(window.$(".media-photo img.photo").attr('src'));
			res.send(window.$(".media-photo img.photo").attr('src'));
		}
	})
}

/*
*	Get content from Pinterest
*/
var pinterest = function(req,res){
	console.log(req.params.pin);
	jsdom.env({
		html:"http://pinterest.com/pin/"+req.params.pin,
		scripts: ["http://code.jquery.com/jquery.js"],
		done: function(err, window){
			console.log(window.$("img.pinImage").attr('src'));
			res.send(window.$("img.pinImage").attr('src'));
		}
	})
}

/*
*	Get content from panoramio.
*/
var panoramio = function(req,res){
	console.log(req.params.key);
	jsdom.env({
		html:"http://www.panoramio.com/photo/"+req.params.key,
		scripts: ["http://code.jquery.com/jquery.js"],
		done: function(err, window){
			console.log(window.$("#main-photo").find('img').attr('src'));
			res.send(window.$("#main-photo").find('img').attr('src'));
		}
	})		
}

/*
*	Export functions. 
*/
exports.instagram = instagram;
exports.pinterest = pinterest;
exports.panoramio = panoramio;
