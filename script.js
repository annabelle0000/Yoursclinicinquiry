const usermessageinput = document.getElementById("userinput");
usermessageinput.addEventListener("keydown", function (event){
    if (event.key == "Enter" && !event.isComposing) {
        event.preventDefault();
        document.getElementById("SentBTN").click();
    }
});

function sendReport(finalReport){
    const url = 'https://script.google.com/macros/s/AKfycbz3xGLYIGtISZmR5vlDwd0HcKmb-pon8xMbvaQLX7GieiNpoqQxwZ3T_8S3X9CB_zPVIQ/exec';
    const reportContent = [
        '======== 病歷 =======',
        `${finalReport}`,
        '====================='
    ].join('\n');
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({content: reportContent})

    })

    .then(response => response.text())
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error('Error:',error);
        sendErrorReport(error);
    });
    console.log("最後醫療敘述以傳送:", finalReport);

}

function sendErrorReport(error) {
    const now = new Date();
    const timestamp = now.toLocaleString('zh-TW', { hour12: false });

    const historyText = conversationHistory.map((msg, idx) => `${idx + 1}. ${msg.role === 'user' ? '使用者' : '助理'}: ${msg.message}`).join('\n');
    const ReportContent = [
    '===== 錯誤回報 =====',
    `時間：${timestamp}`,
    `錯誤訊息: ${error.message}`,
    '',
    `------ 對話歷史 ------`,
    historyText,
    '===================='
    ].join('\n');

    const url = 'https://script.google.com/macros/s/AKfycbzZmD8b0-HYXdiPsWNcnweE6-9sKRMSTHr1WAPSccHqVNXwagfefRtCXTuofKzcg2jxog/exec';
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ content: ReportContent })
    })
    .then(response => response.text())
    .then(data => {
        console.log('錯誤回報已發送:', data);
    })
    .catch(reportError => {
        console.error('錯誤回報發送失敗:', reportError);
    });

    return ReportContent;
}


let conversationHistory = [];


window.sendMessage = async function (userMessage) {
    conversationHistory.push({ role: "user", message: userMessage });
    
    try {
        const historyForAPI = conversationHistory.filter((msg, idx) => {
            if (idx === 0 && msg.role === "assistant") {
                return false;
            }
            return true;
        });
        
        const formattedConversation = historyForAPI.map(msg => ({
            role: msg.role, 
            content: [{ text: msg.message }]
        }));
        
        console.log("發送到後端的對話歷史:", JSON.stringify(formattedConversation));
        
        const response = await fetch("https://us-central1-gen-lang-client-0432629452.cloudfunctions.net/backendFunction", {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversation: formattedConversation
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API 呼叫錯誤 (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        const trimmedResponse = data.response.trim();

        if (trimmedResponse.includes("病歷簡介：")) {
            conversationHistory.push({ role: "assistant", message: "感謝您提供完整資訊，我們已完成資料整理。" });
            sendReport(trimmedResponse);
            const inputArea = document.getElementById("inputarea");
            inputArea.innerHTML = '<p>感謝您提供完整資訊，請稍待片刻等待就診。另外在候位之餘想邀請您<a href="https://forms.gle/Ema6yXHhNHZ6dB6x6" target="_blank">點此</a>回饋您的使用體驗！</p>';
            return "感謝您！";
        } else {
            conversationHistory.push({ role: "assistant", message: trimmedResponse });
            return trimmedResponse;
        }
    } catch (error) {
        console.error("錯誤：", error);
        const formattedReport=sendErrorReport(error);
        return formattedReport;
    }
};

async function initializeChat() {
    try {
        const response = await fetch("https://us-central1-gen-lang-client-0432629452.cloudfunctions.net/backendFunction", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversation: [
                {
                    role: 'user',
                    content: [{ text: 'INIT_CHAT' }]
                }
                ]
            })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Network response was not ok: ${errorText}`);
    }

    const data = await response.json();
    const welcomeMessage = data.response.trim();

    conversationHistory.push({ role: "assistant", message: welcomeMessage });

    const chatLog = document.getElementById("chatarea");
    const welcomeMsgDiv = document.createElement("div");
    welcomeMsgDiv.className = "botmessage";
    welcomeMsgDiv.textContent = welcomeMessage;
    chatLog.appendChild(welcomeMsgDiv);

    return welcomeMessage;

} catch (error) {
    console.log("初始化錯誤:", error);
    sendErrorReport(error);
    const chatLog = document.getElementById("chatarea");
    const errorMsgDiv = document.createElement("div");
    errorMessage.className = "error-message";
    errorMsgDiv.textContent = `初始化錯誤: ${error.message}`;
    chatLog.appendChild(errorMsgDiv);
    return "您好，請問有什麼能幫助您的嗎？";

}
}
document.addEventListener("DOMContentLoaded", async () => {
    await initializeChat();
});

document.getElementById("SentBTN").addEventListener("click", async () => {
    const userMessageInput = document.getElementById("userinput");
    const chatLog = document.getElementById("chatarea");
    const userMessage = userMessageInput.value.trim();
    if (!userMessage) return;

    const userMsgDiv = document.createElement("div");
    userMsgDiv.className = "usermessage";
    userMsgDiv.textContent = userMessage;
    chatLog.appendChild(userMsgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
    userMessageInput.value = "";
    const loadingMsgDiv = document.createElement("div");
    loadingMsgDiv.className = "botmessage loading";
    loadingMsgDiv.textContent = "正在輸入⋯⋯";
    chatLog.appendChild(loadingMsgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;

try {
    const assistantResponse = await window.sendMessage(userMessage);
    chatLog.removeChild(loadingMsgDiv);
    const assistantMsgDiv = document.createElement("div");
    assistantMsgDiv.className = "botmessage";
    assistantMsgDiv.textContent = assistantResponse;
    chatLog.appendChild(assistantMsgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;

} catch (error) {
    chatLog.removeChild(loadingMsgDiv);
    sendErrorReport(error);
    const errorMsgDiv = document.createElement("div");
    errorMsgDiv.className = "error-message";
    errorMsgDiv.textContent = `錯誤: ${error.message}`; 
    chatLog.appendChild(errorMsgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}
});
