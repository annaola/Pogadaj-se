var mysql = require('mysql');
const Sequelize = require('sequelize');
var sha1 = require('sha1');
var Promise = require("bluebird");
var utils = require('./utils.js');
var print = console.log

var sequelize = null;

if (process.env.DATABASE_URL) {
    print("cos");
    // the application is executed on Heroku ... use the postgres database
    sequelize = new Sequelize(process.env.DATABASE_URL)
}
else {
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

//sequelize.query("ALTER DATABASE mysql CONVERT TO CHARACTER SET utf8;")

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

findUserById = function (id, f) {
    var user = User.findOne({
        where: {
            id: id
        }
    }).then(user => { f(user) });
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

addFriend = function (type, user, friend, f) {
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
            if (type == 2) {
                Relation.update({
                    status: 2,
                    action_user_id: user
                }, {
                        where: {
                            [Sequelize.Op.or]: [
                                {
                                    first_user_id: relation.first_user_id,
                                    second_user_id: relation.second_user_id
                                },
                                {
                                    first_user_id: relation.second_user_id,
                                    second_user_id: relation.first_user_id
                                }
                            ]
                        }
                    }).then(rel => {
                        f(4);
                        print("Odrzucenie zaproszenia")
                    })
            }
            else {
                if (relation.status == 0) {
                    if (relation.action_user_id == friend) {
                        Relation.update({
                            status: 1,
                            action_user_id: user
                        }, {
                                where: {
                                    [Sequelize.Op.or]: [
                                        {
                                            first_user_id: relation.first_user_id,
                                            second_user_id: relation.second_user_id
                                        },
                                        {
                                            first_user_id: relation.second_user_id,
                                            second_user_id: relation.first_user_id
                                        }
                                    ]
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
                    if (relation.status == 2) {
                        if (relation.action_user_id == user) {
                            Relation.update({
                                status: 1,
                                action_user_id: user
                            }, {
                                    where: {
                                        [Sequelize.Op.or]: [
                                            {
                                                first_user_id: relation.first_user_id,
                                                second_user_id: relation.second_user_id
                                            },
                                            {
                                                first_user_id: relation.second_user_id,
                                                second_user_id: relation.first_user_id
                                            }
                                        ]
                                    }
                                }).then(rel => {
                                    f(3);
                                    print("Zostaliście znajomymi");
                                });
                        }
                        else {
                            f(5);
                            print("Twoje zaproszenie jest odrzucone");
                        }
                    }
                    else {
                        f(2);
                        print("Już jesteście znajomymi");
                    }
                }
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

listFriendsRequest = function (id, f) {
    var relations = Relation.findAll({
        where: {
            [Sequelize.Op.or]: [
                { first_user_id: id },
                { second_user_id: id },
            ],
            status: 0,
            [Sequelize.Op.not]: [
                { action_user_id: id }
            ]
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

const Message = sequelize.define('message', {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
    },
    room: {
        type: Sequelize.TEXT
    },
    // parentId: {
    //     type: Sequelize.UUID
    // },
    author: {
        type: Sequelize.UUID,
    },
    value: {
        type: Sequelize.TEXT
    },
})

Message.sync() //{force: "true"}

showAllMessages = function () {
    Message.findAll().then(messages => {
        console.log(messages);
    })
}

createMessage = function (room, author, value) {
    return Message.create({
        //parentId: parentId,
        room: room,
        author: author,
        value: value
    })
}

showRoomMessages = function (room, f) {
    Message.findAll({
        where: {
            room: room
        },
        order: [["createdAt", "ASC"]]
    }).then(messages => { f(messages) })
}

showRoomMessagesXtoY = function (room, x, y, f) {
    Message.findAll({
        where: {
            room: room
        },
        order: [["createdAt", "ASC"]],
        offset: x,
        limit: y - x
    }).then(messages => { f(messages) })
}

const Room = sequelize.define('room', {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: Sequelize.TEXT,
    },
    // parentId: {
    //     type: Sequelize.UUID
    // },
    member: {
        type: Sequelize.UUID,
    },
    lastUsed: {
        type: Sequelize.DATE
    }
})

Room.sync() //{force: "true"}

showAllRooms = function () {
    Room.findAll().then(rooms => {
        console.log(rooms);
    })
}

createRoom = function (user, members) {
    User.findById(user).then(userMail => {
        User.findAll({
            where: {
                id: members
            }
        }).then(membersMails => {
            var mails = [];
            membersMails.forEach(mem => {
                mails.push(mem.mail);
            });
            list = mails.sort();
            var name = '';
            for (const l in list) {
                name += l.toString();
            }
            Room.create({
                name: name,
                member: user
            })
            members.forEach(member => {
                Room.create({
                    name: name,
                    member: member
                });
            })
        })
    })
}

addMember = function (name, member) {
    return Room.create({
        name: name,
        member: member
    })
}

lastUsedUpdate = function (room, date) {
    Room.update({
        lastUsed: date
    }, {
            where: {
                name: room
            }
        })
}

module.exports = {
    createUser: createUser,
    showAllUsers: showAllUsers,
    findUserById: findUserById,
    findUserByEmail: findUserByEmail,
    checkValidLogData: checkValidLogData,
    lookForEmail: lookForEmail,

    showAllRelations: showAllRelations,
    addFriend: addFriend,
    listFriends: listFriends,
    listFriendsRequest: listFriendsRequest,

    showAllMessages: showAllMessages,
    createMessage: createMessage,
    showRoomMessages: showRoomMessages,
    showRoomMessagesXtoY: showRoomMessagesXtoY,

    showAllRooms: showAllRooms,
    createRoom: createRoom,
    addMember: addMember,
    lastUsedUpdate: lastUsedUpdate
}
