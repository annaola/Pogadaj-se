var mysql = require('mysql');
var print = console.log

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234"
});

module.exports = {
    deleteDb: function() {
        con.query("DROP TABLE users", function (err, result) {
            if (err) throw err;
            print("Table deleted");
        });
        con.query("DROP TABLE relations", function (err, result) {
            if (err) throw err;
            print("Table deleted");
        });
    },
    useDb: function() {
        con.query("USE mydb", function(err) {
            if (err) throw err;
        });
    },
    initDb: function() {      
        con.connect(function(err) {
            if (err) throw err;
            print("Connected!");
            con.query("CREATE DATABASE IF NOT EXISTS mydb", function(err){
                if (err) throw err;
                con.query("USE mydb", function(err) {
                    if (err) throw err;
                    var sql = "CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), pswd VARCHAR(255))"
                    con.query(sql, function(err, result) {
                        if (err) throw err;
                        print(result.message);
                    });
                    sql = "CREATE TABLE IF NOT EXISTS relations (first_user_id INT, second_user_id INT, status INT, action_user_id INT)"
                    con.query(sql, function(err, result) {
                        if (err) throw err;
                        print(result.message);
                    });
                });
            });
        })
    },
    addFriend: function(id1, id2, action_user_id, callback) {
        if (id1 > id2) {
            var temp = id1;
            id1 = id2;
            id2 = temp;
        }
        var sql = "SELECT * FROM relations WHERE first_user_id = ? and second_user_id = ?";
        con.query(sql, [id1, id2], function (err, result) {
            // 0 - niepotwierdzone zaproszenie
            // 1 - potwierdzone zaproszenie
            if (err) throw err;
            if (result.length > 0) {
                row = JSON.parse(JSON.stringify(result[0]));
                if (row.status == 0 && row.action_user_id != action_user_id) {
                    sql = "UPDATE relations SET status = 1 WHERE first_user_id = ?"
                    con.query(sql, [id1], function (err, result) {
                        if (err) throw err;
                        sql = "UPDATE relations SET action_user_id = ? WHERE first_user_id = ?"
                        con.query(sql, [action_user_id, id1], function (err, result) {
                            if (err) throw err;
                            print("ok");
                        })
                    })
                }
                else {
                    if (row.status == 0 && result.action_user_id == action_user_id) {
                        callback(null, 0); // nie możesz wysłać zaproszenia ponownie
                    }
                    if (row.status == 1) {
                        callback(null, 1); // już jesteście znajomymi
                    }
                    print("no");
                }
            }
            else {
                sql = "INSERT INTO relations (first_user_id, second_user_id, status, action_user_id) VALUES (?, ?, 0, ?)"
                con.query(sql, [id1, id2, action_user_id], function(err, result) {
                    if (err) throw err;
                    print("record inserted")
                });
            }
        });
    },
    createUser: function(name, email, pswd) {
        var sql = "INSERT INTO users (name, email, pswd) VALUES (?, ?, SHA1(?))"
        con.query(sql, [name, email, pswd], function(err, result) {
            if (err) throw err;
            print("record inserted")
        });
    },
    showAllUsers: function () {
        con.query("SELECT * FROM users", function(err, result) {
            if (err) throw error;
            print(result);
        })
    },
    checkIfUserExists: function (name, email, pass, callback) {
        var sql = "SELECT * FROM users WHERE email = ?";
        con.query(sql, [email], function (err, result) {
            print(result);
            if (err) throw err;
            if (result.length > 0) callback(null, true);
            else callback(null, false);
        })
    },
    checkValidLogData: function (email, pass, callback) {
        var sql = "SELECT * FROM users WHERE email = ? AND pswd = SHA1(?)";
        con.query(sql, [email, pass], function (err, result) {
            if (err) callback(err, null);
            else {
                if (result.length > 0) callback(null, true);
                else callback(null, false);
            }
        })
    },
    checkValidLogData: function (email, pass, callback) {
        var sql = "SELECT * FROM users WHERE email = ? AND pswd = SHA1(?)";
        con.query(sql, [email, pass], function (err, result) {
            if (err) callback(err, null);
            else {
                if (result.length > 0) callback(null, true);
                else callback(null, false);
            }
        });
    }
};