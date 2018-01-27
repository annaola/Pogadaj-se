var mysql = require('mysql');
const Sequelize = require('sequelize');
var sha1 = require('sha1');
var Promise = require("bluebird");
var print = console.log

// const sequelize = new Sequelize('mysql', 'root', '1234', {
//     host: 'localhost',
//     dialect: 'mysql',
//     pool: {
//         max: 5,
//         min: 0,
//         acquire: 30000,
//         idle: 10000
//     }
// })

var sequelize = null;

if (process.env.DATABASE_URL) {
    print("cos");
    // the application is executed on Heroku ... use the postgres database
    sequelize = new Sequelize(process.env.PG_DB, process.env.PG_USER, process.env.PG_PASSWORD, {
        dialect: 'postgres',
        protocol: 'postgres',
        port: process.env.PORT,
        host: process.env.HOST,
        logging: true, //false
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    })
} else {
    // the application is executed on the local machine ... use mysql
    sequelize = new Sequelize('mysql', 'root', '1234', {
        host: 'localhost',
        dialect: 'mysql',
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    })
}

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

const User = sequelize.define('user', {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    pass: {
        type: Sequelize.STRING
    }
})

User.sync() //{force: "true"}

showAllUsers = function () {
    User.findAll().then(users => {
        console.log(users);
    })
}

createUser = function (name, email, pass) {
    return User.create({
        name: name,
        email: email,
        pass: sha1(pass)
    })
}

findUserByEmail = function (email, f) {
    var user = User.findOne({
        where: {
            email: email
        }
    }).then(user => { f(user) });
}

checkValidLogData = function (email, pass, f) {
    var user = User.findOne({
        where: {
            email: email,
            pass: sha1(pass)
        }
    }).then(user => { f(user) });
}

lookForEmail = function (em, f) {
    var sql = '%' + em + '%'
    var user = User.findAll({
        where: {
            email: {
                [Sequelize.Op.like]: sql
            }
        }
    }).then(emails => { f(emails) });
}

const Relation = sequelize.define('relation', {
    first_user_id: {
        type: Sequelize.UUID
    },
    second_user_id: {
        type: Sequelize.UUID,
    },
    status: {
        type: Sequelize.SMALLINT
    },
    action_user_id: {
        type: Sequelize.UUID
    }
})

Relation.sync(); //{force: "true"}

showAllRelations = function () {
    Relation.findAll().then(relations => {
        console.log(relations);
    })
}

addFriend = function (user, friend, f) {
    var relation = Relation.findOne({
        where: {
            [Sequelize.Op.or]: [
                {
                    first_user_id: user,
                    second_user_id: friend
                },
                {
                    first_user_id: friend,
                    second_user_id: user
                },
            ]
        }
    }).then(relation => {
        // console.log(relation);
        if (relation) {
            if (relation.status == 0) {
                if (relation.action_user_id == friend) {
                    Relation.update({
                        status: 1
                    }, {
                            where: {
                                first_user_id: relation.first_user_id,
                                second_user_id: relation.second_user_id
                            }
                        }).then(rel => {
                            f(3);
                            print("Zostaliście znajomymi");
                        });
                }
                else {
                    f(1);
                    print("Już wysłano zaproszenie");
                }
            }
            else {
                f(2);
                print("Już jesteście znajomymi");
            }
        }
        else {
            return Relation.create({
                first_user_id: user,
                second_user_id: friend,
                status: 0,
                action_user_id: user
            }).then(rel => {
                f(0);
                print("Wysłano zaproszenie");
            })
        }
    })
}

listFriends = function (id, f) {
    var relations = Relation.findAll({
        where: {
            [Sequelize.Op.or]: [
                { first_user_id: id },
                { second_user_id: id },
            ],
            status: 1
        }
    }).then(relations => {
        var friendsIds = [];
        relations.forEach(rel => {
            if (rel.first_user_id == id) friendsIds.push(rel.second_user_id);
            else friendsIds.push(rel.first_user_id);
        });
        User.findAll({
            where: {
                id: friendsIds
            }
        }).then(users => { f(users) })
    })
}

module.exports = {
    createUser: createUser,
    showAllUsers: showAllUsers,
    findUserByEmail: findUserByEmail,
    checkValidLogData: checkValidLogData,
    lookForEmail: lookForEmail,

    showAllRelations: showAllRelations,
    addFriend: addFriend,
    listFriends: listFriends
}
