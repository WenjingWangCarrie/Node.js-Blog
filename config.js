const mysql = require('mysql'); 

const pool = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: '123456',
	database: 'asyncNode'
});

let query = function(sql, values) {

	return new Promise ((resolve, reject) => {
		pool.getConnection((err, connection) => {
			if (err) {
				reject(err); 
			} else {
				console.log('Successfully connecting to database...');

				connection.query(sql, values, (errors, rows) => {
					if (errors) {
						reject(errors); 
					} else {
						resolve(rows);
					}

					connection.release();
				});
			}
		});
	});
}

let transaction = function(value) {
	return new Promise ((resolve, reject) => {
		pool.getConnection((err, connection) => {
			if (err) {
				reject(err); 
			} else { 
				/* Begin Transaction */
				connection.beginTransaction((e) => {
					if (e) { 
						reject(e);
					} else {
						connection.query("INSERT INTO user SET username = ?, password = ?", value, (errors, results, rows) => {
							if (errors) {
								pool.rollback();
								reject(errors); 
							} else {
								let log = results.insertId;
								connection.query("INSERT INTO log SET logid = ?", log, (errors, results) => {
									if (errors) {
										connection.rollback();
										reject(errors);
									}
									console.log("Successfully create a log that connected with the user");
									connection.commit();
								});
								
								resolve(rows);
							}
							console.log('Transaction Completed.'); 
							connection.release();
						});
					}
				}); // end of transaction

			}
		});
	});
}

let insertUser = function(value) {
	let _sql = "INSERT INTO user SET username = ?, password = ?";
	return query(_sql, value);
}

let insertLog = function(value) {
	let _sql = "INSERT INTO log SET logid = ?";
	return query(_sql, value);
}

let insertPost = function(value) {
	let _sql = "INSERT INTO post SET creator = ?, title = ?, content = ?";
	return query(_sql, value);
}

// check if user already existed
let findUserCountByName = function(username) {
	let _sql = `SELECT count(*) as count FROM user WHERE username = "${username}"`;
	return query(_sql);
}

let findUserByName = function(username) {
	let _sql = `SELECT * FROM user WHERE username = "${username}"`;
	return query(_sql);
}

let findAllPosts = function() {
	let _sql = `SELECT * FROM post`;
	return query(_sql);
}

module.exports = {
	query,
	transaction,
	insertUser,
	insertLog,
	insertPost,
	findUserCountByName,
	findUserByName,
	findAllPosts
};



