module.exports = {
    intDictEncode: function (dict) {
        var text = ""
        for (const d in dict) {
            text = text + '+' + dict[d].toString();
        }
        text=text.slice(1)
        console.log(text)
        return text
    },
    intDictDecode: function (str) {
        var text = ""
        var dict = {}
        var num = 1
        console.log(str);
        for (const s in str) {
            if (str[s] != '+') {
                text += str[s];
            }
            else {
                dict[num] = parseInt(text);
                text = '';
                num += 1;
            }
        }
        if (text!='') {
            dict[num] = parseInt(text);
        }
        return dict
    },
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
        return friends;
    },
}