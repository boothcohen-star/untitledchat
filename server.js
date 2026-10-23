
const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;

const page = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>UntitledChat</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:Arial,sans-serif;background:#313338;color:#f2f3f5;height:100vh;overflow:hidden}
.app{display:flex;height:100vh}
.sidebar{width:240px;flex-shrink:0;background:#2b2d31;padding:20px 12px;display:flex;flex-direction:column}
.brand{font-size:22px;font-weight:bold;padding:8px 10px 24px;color:white}
.section{font-size:11px;font-weight:bold;color:#949ba4;margin:8px 8px}
.channel{padding:11px 12px;border-radius:6px;color:#b5bac1;cursor:pointer;margin-bottom:4px}
.channel:hover,.channel.active{background:#404249;color:white}
.profile{margin-top:auto;background:#232428;padding:12px;border-radius:8px}
.profile small{color:#949ba4}
.main{flex:1;display:flex;flex-direction:column;min-width:0}
.header{height:62px;border-bottom:1px solid #25262a;display:flex;align-items:center;padding:0 22px;font-weight:bold;gap:10px}
.messages{flex:1;overflow-y:auto;padding:20px 24px}
.welcome{padding:16px 0 24px;border-bottom:1px solid #41434a;margin-bottom:20px}
.welcome h1{font-size:26px;margin:0 0 8px}
.welcome p{color:#b5bac1;margin:0}
.message{display:flex;gap:12px;margin:18px 0}
.avatar{width:38px;height:38px;border-radius:50%;background:#5865f2;display:flex;align-items:center;justify-content:center;font-weight:bold;flex-shrink:0}
.msgbody{min-width:0}
.msgtop{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
.username{font-weight:bold}
.time{font-size:11px;color:#949ba4}
.msgtext{margin-top:5px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.4}
.composer-wrap{padding:0 22px 24px}
.composer{display:flex;gap:10px;background:#383a40;border-radius:10px;padding:10px}
.composer input{flex:1;min-width:0;background:transparent;border:0;outline:none;color:white;font-size:15px}
button{border:0;border-radius:7px;padding:10px 16px;background:#5865f2;color:white;font-weight:bold;cursor:pointer}
button:hover{background:#4752c4}
button:disabled{opacity:.5;cursor:default}
.status{font-size:12px;color:#949ba4;margin:0 4px 8px}
.mobile-title{display:none}
@media(max-width:600px){
.sidebar{width:118px;padding:12px 7px}
.brand{font-size:16px;padding:8px 4px 20px}
.channel{padding:10px 6px;font-size:13px}
.section{font-size:9px;margin-left:5px}
.profile{padding:8px;font-size:12px;overflow-wrap:anywhere}
.messages{padding:14px}
.header{padding:0 14px}
.composer-wrap{padding:0 10px 12px}
.welcome h1{font-size:22px}
}
</style>
</head>
<body>
<div class="app">
<aside class="sidebar">
<div class="brand">✦ UntitledChat</div>
<div class="section">TEXT CHANNELS</div>
<div class="channel active" data-channel="general"># general</div>
<div class="channel" data-channel="gaming"># gaming</div>
<div class="channel" data-channel="memes"># memes</div>
<div class="profile">
<div id="profileName">Guest</div>
<small>Online</small>
</div>
</aside>
<main class="main">
<header class="header"><span id="channelTitle"># general</span></header>
<div class="messages" id="messages">
<div class="welcome">
<h1>Welcome to #general!</h1>
<p>This is the beginning of this channel. Say hello!</p>
</div>
</div>
<div class="composer-wrap">
<div class="status" id="status">Connecting to chat...</div>
<form class="composer" id="chatForm">
<input id="messageInput" maxlength="1500" placeholder="Message #general" autocomplete="off" disabled>
<button id="sendButton" type="submit" disabled>Send</button>
</form>
</div>
</main>
</div>

<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
<script>
const firebaseConfig = {
  apiKey: "AIzaSyCvG8mJ_AjCXmixbb5acNa0_NjHX9wnrEY",
  authDomain: "untitledchat-a5c3b.firebaseapp.com",
  projectId: "untitledchat-a5c3b",
  storageBucket: "untitledchat-a5c3b.firebasestorage.app",
  messagingSenderId: "230159692905",
  appId: "1:230159692905:web:a3c9aeace705a90ce75ef8",
  measurementId: "G-HSLC7QGTY6"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const messagesEl = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const statusEl = document.getElementById("status");
const form = document.getElementById("chatForm");
const title = document.getElementById("channelTitle");
let currentChannel = "general";
let currentUser = null;
let unsubscribe = null;
let sending = false;

function showStatus(text) {
  statusEl.textContent = text;
}

function showWelcome() {
  messagesEl.replaceChildren();
  const welcome = document.createElement("div");
  welcome.className = "welcome";
  const heading = document.createElement("h1");
  heading.textContent = "Welcome to #" + currentChannel + "!";
  const paragraph = document.createElement("p");
  paragraph.textContent = "This is the beginning of this channel. Say hello!";
  welcome.append(heading, paragraph);
  messagesEl.appendChild(welcome);
}

function renderMessage(data) {
  const row = document.createElement("div");
  row.className = "message";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = (data.username || "G").slice(0, 1).toUpperCase();

  const body = document.createElement("div");
  body.className = "msgbody";

  const top = document.createElement("div");
  top.className = "msgtop";

  const username = document.createElement("span");
  username.className = "username";
  username.textContent = data.username || "Guest";

  const time = document.createElement("span");
  time.className = "time";
  time.textContent = data.createdAt && data.createdAt.toDate
    ? data.createdAt.toDate().toLocaleString()
    : "Just now";

  const text = document.createElement("div");
  text.className = "msgtext";
  text.textContent = data.text || "";

  top.append(username, time);
  body.append(top, text);
  row.append(avatar, body);
  messagesEl.appendChild(row);
}

function listenToChannel() {
  if (unsubscribe) unsubscribe();
  showWelcome();
  title.textContent = "# " + currentChannel;
  input.placeholder = "Message #" + currentChannel;

  if (!currentUser) return;

  unsubscribe = db.collection("messages")
    .where("channel", "==", currentChannel)
    .orderBy("createdAt", "asc")
    .limitToLast(100)
    .onSnapshot(function(snapshot) {
      showWelcome();
      snapshot.forEach(function(doc) {
        renderMessage(doc.data());
      });
      messagesEl.scrollTop = messagesEl.scrollHeight;
      showStatus("Connected as " + currentUser.displayName);
    }, function(error) {
      console.error(error);
      showStatus("Chat error: check your Firestore security rules and indexes.");
    });
}

document.querySelectorAll(".channel").forEach(function(channelEl) {
  channelEl.addEventListener("click", function() {
    document.querySelectorAll(".channel").forEach(function(el) {
      el.classList.remove("active");
    });
    channelEl.classList.add("active");
    currentChannel = channelEl.dataset.channel;
    listenToChannel();
  });
});

form.addEventListener("submit", async function(event) {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || !currentUser || sending) return;

  sending = true;
  sendButton.disabled = true;

  try {
    await db.collection("messages").add({
      text: text,
      username: currentUser.displayName,
      channel: currentChannel,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    input.value = "";
  } catch (error) {
    console.error(error);
    showStatus("Couldn't send. Check your Firestore security rules.");
  } finally {
    sending = false;
    sendButton.disabled = false;
    input.focus();
  }
});

auth.signInAnonymously().then(async function(result) {
  const user = result.user;
  let username = localStorage.getItem("untitledchat_username");

  if (!username) {
    username = prompt("Choose a username (2–24 characters):");
    if (!username || !username.trim()) username = "Guest" + user.uid.slice(0, 4);
    username = username.trim().slice(0, 24);
    localStorage.setItem("untitledchat_username", username);
  }

  currentUser = { uid: user.uid, displayName: username };
  document.getElementById("profileName").textContent = username;
  input.disabled = false;
  sendButton.disabled = false;
  listenToChannel();
}).catch(function(error) {
  console.error(error);
  showStatus("Couldn't connect. Check that Anonymous Authentication is enabled.");
});
</script>
</body>
</html>`;

app.get("/", (req, res) => {
  res.type("html").send(page);
});

app.get("/health", (req, res) => {
  res.send("UntitledChat is running");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("UntitledChat running on port " + PORT);
});
