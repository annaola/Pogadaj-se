function sendAnswer(friendEmail, type, boxId){
    $.post("/addFriend",        
    {
        userId: '<%= userId %>', //TODO prawdopodobnie do usunięcia
        friendEmail: friendEmail,
        type: type
    });
    box = document.getElementById(boxId);
    if(type == 1){
        box.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            <strong>Sukces!</strong> Jesteście teraz znajomymi!
        </div>`;
    }
    else{
        box.innerHTML = `
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            Zaproszenie zostało odrzucone.
        </div>`;
    }
    
}
window.addEventListener('load', function () {
    var socket = io();
    socket.on('diag', function (data) {
        if (data = "notLogged") {
            var b = document.getElementById('inBody');
            b.innerHTML = "<h1 class='error'>Zaloguj się!</h1>";
            alert("Musisz się zalogować!");
            window.location.href = '../';
        }
    })
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