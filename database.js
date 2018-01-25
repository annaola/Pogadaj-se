var mysql = require('mysql');
var print = console.log

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234"
});

module.exports = {
    dropUsers: function() {
        con.query("DROP TABLE users", function (err, result) {
            if (err) throw err;
            print("Table deleted");
        });
    },
    dropRelations: function() {
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
    
    createUser: function(name, email, pswd) {
        var sql = "INSERT INTO users (name, email, pswd) VALUES (?, ?, SHA1(?))"
        con.query(sql, [name, email, pswd], function(err, result) {
            if (err) throw err;
            print("record inserted")
        });
    },
    findUserByEmail: function(email, callback) {
        var sql = "SELECT * FROM users WHERE email = ?"
        con.query(sql, [email], function(err, result) {
            if (err) throw err;
            if (result.length == 0) callback(null, null);
            else {
                var rows = JSON.parse(JSON.stringify(result[0]));
                //print(rows);
                callback(null, rows);
            }
        })
    },
    showAllUsers: function () {
        con.query("SELECT * FROM users", function(err, result) {
            if (err) throw error;
            print(result);
        })
    },
    checkIfUserExists: function (email, pass, callback) {
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
                if (result.length > 0) callback(null, result[0].id);
                else callback(null, false);
            }
        })
    },
    showAllRelations: function () {
        con.query("SELECT * FROM relations", function(err, result) {
            if (err) throw error;
            print(result);
        })
    },
    lookForEmail: function (str, callback) {
        var sql = "SELECT * FROM users WHERE email LIKE '%" + str + "%'"
        con.query(sql, [str], function (err, result) {
            if (err) callback(err, null);
            else {
                var rows = JSON.parse(JSON.stringify(result));
                callback(null, rows);
            }
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
                var row = JSON.parse(JSON.stringify(result[0]));
                if (row.status == 0 && row.action_user_id != action_user_id) {
                    sql = "UPDATE relations SET status = 1 WHERE first_user_id = ?"
                    con.query(sql, [id1], function (err, result) {
                        if (err) throw err;
                        sql = "UPDATE relations SET action_user_id = ? WHERE first_user_id = ?"
                        con.query(sql, [action_user_id, id1], function (err, result) {
                            if (err) throw err;
                            callback(null, null);
                        })
                    })
                }
                else {
                    if (row.status == 0 && row.action_user_id == action_user_id) {
                        callback(null, 0); // nie możesz wysłać zaproszenia ponownie
                    }
                    if (row.status == 1) {
                        callback(null, 1); // już jesteście znajomymi
                    }
                }
            }
            else {
                sql = "INSERT INTO relations (first_user_id, second_user_id, status, action_user_id) VALUES (?, ?, 0, ?)"
                con.query(sql, [id1, id2, action_user_id], function(err, result) {
                    if (err) throw err;
                    callback(null, null);
                });
            }
        });
    },
    listFriends: async function(id, callback) {
        var sql = "SELECT first_user_id, second_user_id FROM relations WHERE (first_user_id = ? OR second_user_id = ?) AND status = 1"
        await con.query(sql, [id, id], function (err, result) {
            if (err) throw err;
            var rows = JSON.parse(JSON.stringify(result));
            var friends = [];
            rows.forEach(async element => {
                if (element.first_user_id == id) {
                    con.query("SELECT * FROM users WHERE id = ?", [element.second_user_id], async function (err, result) {
                        await friends.push(JSON.parse(JSON.stringify(result[0])));
                    })
                }
                else {
                    con.query("SELECT * FROM users WHERE id = ?", [element.first_user_id], async function (err, result) {
                        await friends.push(JSON.parse(JSON.stringify(result[0])));
                    })
                }
            });
            print(friends);
            //callback(null, friends);
            
        })
    }
};