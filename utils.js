
var db = require('./database.js');

module.exports = {
    makeRoomName: function (userMail, userList) {
        mailList=userList.concat([userMail])
        sList = mailList.sort();
        var sList = sList.filter(function(elem, index, self) {
                return index === self.indexOf(elem);
        })
        name = ''
        for (const user in sList) {
            name += sList[user].toString();
        }
        return name;
    }
};
