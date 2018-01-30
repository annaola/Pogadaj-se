emailList = []
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function addMail(){
    emailLine = document.getElementById("dvEmailLine");
    p = "";
    if(document.getElementsByClassName("emailList").length > 0 ){
        p=", "
    };
    friendEmail = document.getElementById("friendEmail")
    email = friendEmail.value
    
    if(validateEmail(email) && emailList.indexOf(email)==-1){
        emailLine.innerHTML += `${p}<div class="emailList"> ${friendEmail.value} </div>`
        emailList.push(email);
    }
    friendEmail.value='';
}
var socket = io();

//funckja do wybierania konkretnego pokoju
function chooseRoom(mailList) {

    // room = makeRoomName([homeEmail].concat(mailList));
    msg = document.getElementById("messages");
    msg.innerHTML = "";
    socket.emit('room', mailList);

}
socket.on('diag', function (data) {
    if (data = "notLogged") {
        var b = document.getElementById('inBody');
        b.innerHTML = "<h1 class='error'>Zaloguj się!</h1>";
        alert("Musisz się zalogować!");
        window.location.href = '../';
    }
})
//emitowanie informacji o wyjściu z czatu, żeby usunąć socket z listy aktywnych
window.addEventListener('beforeunload', function (event) {
    socket.emit('diag', "exit");
});

window.addEventListener('load', function () {

    //wyświetlanie czasu
    socket.on('time', function (data) {
        var t = document.getElementById('time');
        t.innerHTML = data;
    });
    //prośba o listę znajomych
    socket.emit('friend list', "start");

    //otrzymanie listy znajomych
    socket.on('friend list', function (list) {
        var fList = document.getElementById('friendBox');
        var fListMenu = document.getElementById('FriendsOnMenu');
        if (list.length > 0){
            fList.innerHTML += "<h1>Friends:</h1>";

            for (const friend in list) {
                //to chyba nie jest najładniejszy sposób, ale działa.
                //Każdy wpis z listy przyjaciół pakuję w diva
                var box1 = `<div 
                                class="dvFriends"
                                id="fr${list[friend].id}" 
                                onclick="chooseRoom(['${list[friend].email}']);" 
                                style="cursor: pointer;">${list[friend].name}</div>`

                var box2 = `<a  class="dropdown-item"
                                onclick="chooseRoom(['${list[friend].email}']);"
                                style="cursor: pointer;"
                                id="fr${list[friend].id}">
                                    ${list[friend].name}
                            </a>`
                fList.innerHTML += box1;
                fListMenu.innerHTML += box2;

            };
        }

    });

    //wyświetlanie wiadomości:
    socket.on('chat message', function (data) {
        var msg = document.getElementById('messages');
        if(data.email == userEmail){
            msg.innerHTML += '<p class="incmsg">' + htmlEntities(data.value) + '</p>';
        }
        else{
            msg.innerHTML += '<p class="foreign_incmsg">' + htmlEntities(data.value) + '</p>';
        }
        msg.scrollTop = msg.scrollHeight;
    });

    //Wysyłanie wiadomości:
    function sendMsg(txtmessage){
        if(txtmessage.value != ""){
            for (let index = 0; index < txtmessage.value.length - 500; index+=0) {
                var msg_part = txtmessage.value.substring(0,500);	
                txtmessage.value = txtmessage.value.substring(500,txtmessage.value.length);	
                socket.emit('chat message', {value: msg_part, email: userEmail});
            }
            socket.emit('chat message', {value: txtmessage.value.substring(0,1000), email: userEmail});
            txtmessage.value = "";
        }
    };

    var btsend = document.getElementById('btsend');
    btsend.addEventListener('click', function () {
        var txtmessage = document.getElementById('txtmessage');
        sendMsg(txtmessage);
    });
    var txtsend = document.getElementById('txtmessage');
    txtsend.addEventListener('keypress', function (e) {
        var key = e.which || e.keyCode;
        if (key === 13) { // 13 is enter
            sendMsg(txtsend);
        }
    });
    document.getElementById("submitNewMsg").addEventListener("click", function() {
        chooseRoom(userEmail, emailList);
        emailList = [];
        document.getElementById("dvEmailLine").innerHTML="";
    });
    document.getElementById("resetNewMsg").addEventListener("click", function() {
        emailList = [];
        document.getElementById("dvEmailLine").innerHTML="";
    });
    addFriendEmail = document.getElementById('friendEmail');
    addFriendEmail.addEventListener('input', function(){
        // alert(addFriendEmail.value);
        socket.emit('user list', addFriendEmail.value);
    });

    socket.on('user list', function (data) {
        var list = document.getElementById('emailSelect');
        // console.log(data, data.email, data.value)
        options = ""
        for( i in data){
            options +=`<option>${data[i].email}\n`;
            // console.log(data[i])
        }
        list.innerHTML = options;

    });
});
