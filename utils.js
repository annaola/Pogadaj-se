module.exports = {
    isValid: function (email, password) {
        // TODO
        return true;
    },
    friendList: function (email) {
        // TODO
        //można założyć, że maile są unikalne, mogą być naszym id na razie
        friends=[];
        for (let i = 0; i < 5; i++) {
            friends[i]={
                email: `${i}`+email,
                id: `${i}`+email,
                name: `Mister von ${i}stein`
            };
            
        }
        if (email=="michal.mar3@gmail.com") {
            friends[5]={
                email: "basia.martusewicz@gmail.com",
                id: "basia.martusewicz@gmail.com",
                name: `Basia Martusewicz`
            };
        } else {
            friends[5]={
                email: "michal.mar3@gmail.com",
                id: "michal.mar3@gmail.com",
                name: `Michał Martusewicz`
            };
        }
        return friends;
    },
    makeRoomName: function (userList){
        sList=userList.map(l => l.id).sort();
        name=''
        for (const user in sList) {
            name+=sList[user].toString();
        }
        return name;
    }
}