function botmessage() {
    const Chatarea = document.getElementById("chatarea");
    const welcomemsgdiv = document.createElement("div");
    welcomemsgdiv.className = "botmessage";
    welcomemsgdiv.textContent = "I'll be your assistant today. How can I help you?";
    Chatarea.appendChild(welcomemsgdiv);

}

function usermessage() { 
    const Epyt = document.getElementById("userinput");
    const TrimEpyt = Epyt.value.trim();
    const Chatarea = document.getElementById("chatarea");
    const usermsgdiv = document.createElement("div");
    if (!TrimEpyt) return;
    usermsgdiv.className = "usermessage";
    usermsgdiv.textContent = TrimEpyt;
    Chatarea.appendChild(usermsgdiv);
    Epyt.value="";

}


const usermessageinput = document.getElementById("userinput");
usermessageinput.addEventListener("keydown", function (event){
    if (event.key == "Enter" && !event.isComposing) {
        event.preventDefault();
        document.getElementById("SentBTN").click();
    }
})


const Sendaa = document.getElementById("SentBTN");

Sendaa.addEventListener("click", usermessage);

