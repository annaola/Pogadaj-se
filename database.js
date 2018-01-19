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
                });
            });
        })
    },
    createUser: function(name, email, pswd) {
        var sql = "INSERT INTO users (name, email, pswd) VALUES (?, ?, SHA1(?))"
        con.query(sql, [name, email, pswd], function(err, result) {
            if (err) throw err;
            print("record inserted")
        })
    },
    showAllUsers: function () {
        con.query("SELECT * FROM users", function(err, result) {
            if (err) throw error;
            print(result);
        })
    },
    checkIfUserExists: function (name, email) {
        var sql = "SELECT 1 FROM users WHERE name = ? OR email = ?";
        con.query(sql, [name, email], function (err, result) {
            if (err) throw err;
            if (result.length > 0) return true;
            return false;
        })
    },
    checkValidLogData: function (email, pass) {
        var sql = "SELECT 1 FROM users WHERE email = ? AND pswd = ?";
        con.query(sql, [email, pass], function (err, result) {
            if (err) throw err;
            if (result.length > 0) return true;
            return false;
        });
    }
};