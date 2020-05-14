const mysql = require('mysql');
const express = require('express');  
const bodyParser = require('body-parser'); 
const cookieParser = require('cookie-parser');
const path = require('path');
const connection = require('./config'); 
const md5 = require('md5'); // hash message

/* JWT needs to be stored inside an httpOnly cookie,
   that’s only sent in HTTP requests to the server, 
   never accessible from JavaScript running in the browser
*/
let jwt = require('jsonwebtoken');
let jwtSecret = require('./jwtSecret');
let middleware = require('./middleware');

const PORT = process.env.PORT || 3000;
const app = express();
  
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded
app.use(bodyParser.json()); // for parsing application/json
app.use(cookieParser());

app.get('/', async(req, res) => {
	res.sendFile(path.join(__dirname + '/home.html'));
});

app.get('/signup', async(req, res) => {
	res.sendFile(path.join(__dirname + '/signup.html'));
});

app.get('/login', async(req, res) => {
	res.sendFile(path.join(__dirname + '/login.html'));
});

app.get('/createPost', middleware, async(req, res) => { 
	res.sendFile(path.join(__dirname + '/createPost.html'));
});

app.get('/logout', async(req, res) => { 
  	res.clearCookie('username');
    res.redirect('/');
});

// sign up  
app.post('/signup', async(req, res) => {
	let users = {
		username: req.body.username,
		password: req.body.password
	}

	await connection.findUserCountByName(users.username)
		.then(async (result) => {  

			// check user existed or not
			if (result[0].count >= 1) { 
				console.log("User already existed");
				res.status(400).send("User already existed, please try again");
			} else {
				await connection.transaction([users.username, md5(users.password)])
					.then(async (result) => {
						res.status(200).json(req.body); 
						console.log("Successfully create a user");
						
					}).catch(err => {
						res.status(400).json("Failed to signup"); 
						console.log(err);
					});	
			} 
		});

});

// login    
app.post('/login', async(req, res) => {
	let username = req.body.username;
	let password = req.body.password; 

	await connection.findUserByName(username)
		.then(result => {
			let ans = result;

			// login successfully
			if (ans.length && username === ans[0]['username'] && md5(password) === ans[0]['password']) {
				
				res.cookie('username', ans[0]['username']); // save user status
				console.log(`Successfully login as ${username}`); 

				// payload - username can be used to find out which user is the owner of the token
				let token = jwt.sign({username: username}, jwtSecret.secret, {expiresIn: '1h'});
				res.cookie('auth', token);

				res.status(200).json({
					success: true,
					message: 'Authentication Successfully!',
					token: token
				});

			} else {
				res.status(403).json({
					success: false,
					message: 'Incorrect Username/Password'
				});

				console.log("Wrong Username/Password, Please try again.");
			}

		}).catch(err => {
			console.log(err);
		}); 
});

// after logged in - create a post
app.post('/createPost', async(req, res) => {
	if (req.cookies.username) {
		let posts = {
			creator: req.cookies.username,
			title: req.body.title,
			content: req.body.content
		}

		await connection.insertPost([posts.creator, posts.title, posts.content])
			.then(() => { 
				console.log('Successfully create a post'); 
				res.redirect('/');

			}).catch((err) => {
				console.log('Failed create a post', err);
				res.status(400).send("Failed to create a post"); 
			}); 

	} else {
		res.status(400).send('Need to login first');
	}
});

// display posts
app.post('/', async(req, res) => { 

	await connection.findAllPosts()
		.then(rows => {
			// get data from database, next need to transfer data to html 
			res.json(rows);
			console.log('Display posts...');
			/*
			rows.forEach((row) => {
				console.log(`Creator: ${row.creator} Title: ${row.title} Content: ${row.content}`);
			});
			*/

		}).catch(err => {
			console.log('Failed to display posts', err);
			res.status(400).send("Failed to display posts");
		}); 
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

