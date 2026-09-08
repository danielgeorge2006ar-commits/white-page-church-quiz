
const socket = io();

const screens = {
  loading: document.getElementById("loading"),
  denied: document.getElementById("denied"),
  quiz: document.getElementById("quiz"),
  done: document.getElementById("done")
};

function show(name){
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

let heartbeatTimer = null;
let access = false;

socket.on("connect", () => show("loading"));

socket.on("access-granted", () => {
  access = true;
  show("quiz");
  heartbeatTimer = setInterval(() => socket.emit("heartbeat"), 5000);
});

socket.on("access-denied", () => {
  access = false;
  show("denied");
});

socket.on("site-available", () => {
  if (!access) location.reload();
});

// Keep the lock only while this page is alive.
window.addEventListener("beforeunload", () => {
  if (access) socket.emit("release-access");
});

const choices = document.querySelectorAll(".choice");
const result = document.getElementById("result");
const finish = document.getElementById("finish");

// The correct answer can be changed here.
// Current setting: د. إيليا
const CORRECT_ANSWER = "د. إيليا";

choices.forEach(btn => {
  btn.addEventListener("click", () => {
    choices.forEach(c => c.disabled = true);
    const answer = btn.dataset.answer;
    btn.classList.add("selected");

    if (answer === CORRECT_ANSWER) {
      btn.classList.add("correct");
      result.textContent = "إجابة صحيحة! 🤍";
      result.className = "result ok";
    } else {
      btn.classList.add("wrong");
      const correct = [...choices].find(c => c.dataset.answer === CORRECT_ANSWER);
      if (correct) correct.classList.add("correct");
      result.textContent = "الإجابة مش صحيحة، جرّب تركز في شخصية الكنز 😉";
      result.className = "result no";
    }
    finish.hidden = false;
  });
});

finish.addEventListener("click", () => {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  socket.emit("release-access");
  access = false;
  show("done");
});
