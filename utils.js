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
    }

}