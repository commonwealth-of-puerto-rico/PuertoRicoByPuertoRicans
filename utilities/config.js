/*
*	Configuration settings and credentials are here
*	Information here should be excluded from public view.
*/

/* Database */
exports.databaseURL = 'MONGO_DB URL';

/* Session secret */
exports.secret = 'SESSION SECRETs';

/*	Twitter Credentials. */
exports.twitter = {
	key:"TWITTER USER KEY",
	secret:"TWITTER SECRET KEY"
};

/* Facebook Credentials. */
exports.facebook = {
	id:"FACEBOOK USER ID",
	secret:"FACEBOOK SECRET KEY"
};

/* Google+ Credentials.  */
exports.googleProduction = {
	clientID: 'GOOGLE CLIENT ID',
	clientSecret: 'GOOGLE SECRET KEY'	
};

/* Sendgrid Credentials.  */
exports.sendgrid = {
	username: 'SendGrid USER NAME',
	password: 'SENDGRID PASSWORD',
}

/* AWS Credentials.  */
exports.S3 = {
	key: 'KEY',
	secret : 'SECRET',
	bucket: 'BUCKET NAME'
}