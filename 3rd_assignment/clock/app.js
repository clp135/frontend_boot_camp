const $ = (sel) => document.querySelector(sel);
const pad2 = (n) => String(n).padStart(2, "0");
const formatHMS = (ms) => {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
};
const formatKoreanHMS = (ms) => {
  const t = Math.max(0, Math.floor(ms/1000));
  const h = Math.floor(t/3600);
  const m = Math.floor((t%3600)/60);
  const s = t%60;
  const parts = [];
  if (h) parts.push(`${h}시간`);
  if (m) parts.push(`${m}분`);
  parts.push(`${s}초`);
  return parts.join(" ");
};

// 시간 표시 
function updateClock(){
  const now = new Date();
  const str =
    `${now.getFullYear()}-${pad2(now.getMonth()+1)}-${pad2(now.getDate())} ` +
    `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
  $("#clockDisplay").textContent = str;
}
setInterval(updateClock, 1000);
updateClock();

// 배터리 감소
let battery = 100;
function renderBattery(){
  $("#batteryText").textContent = `${battery}%`;
  if (battery <= 0){
    battery = 0;
    $("#clockDisplay").classList.add("blackout");  // FR2: 시간 영역만 검정
  }
}
renderBattery();
setInterval(()=>{
  if (battery > 0){
    battery -= 1;
    renderBattery();
  }
}, 1000);

// 알람 관리
const MAX_ALARMS = 3;
let alarms = []; // {id, lengthMs, remainingMs, timer}

const alarmList = $("#alarmList");
const limitMsg = $("#limitMsg");

function addAlarm(lengthMs){
  // 최대 개수 제한
  if (alarms.length >= MAX_ALARMS){
    limitMsg.textContent = "최대 3개 알람까지 가능합니다.";
    return;
  }
  limitMsg.textContent = "";

  const id = Date.now().toString(36);
  const alarm = {
    id,
    lengthMs,
    remainingMs: lengthMs,
    timer: null
  };
  alarms.push(alarm);
  paintAlarms();
  startCountdown(alarm);

  // 최근 길이 저장 (FR5)
  localStorage.setItem("lastAlarmMs", String(lengthMs));
  updateRecentRow();
}

function startCountdown(alarm){
  const tick = ()=>{
    alarm.remainingMs -= 1000;
    if (alarm.remainingMs <= 0){
      clearInterval(alarm.timer);
      alarm.timer = null;
      alarm.remainingMs = 0;
      paintAlarms();
      // 간단 알림
      alert("🔔 알람! 설정한 시간이 종료되었습니다.");
      return;
    }
    paintAlarms();
  };
  alarm.timer = setInterval(tick, 1000);
  tick(); // 즉시 반영
}

function removeAlarm(id){
  const idx = alarms.findIndex(a => a.id === id);
  if (idx >= 0){
    if (alarms[idx].timer) clearInterval(alarms[idx].timer);
    alarms.splice(idx,1);
    paintAlarms();
    limitMsg.textContent = "";
  }
}

function paintAlarms(){
  if (alarms.length === 0){
    alarmList.innerHTML = `<div class="alarm-empty" style="color:#9aa39a;">등록된 알람이 없습니다.</div>`;
    return;
  }
  alarmList.innerHTML = alarms.map((a, i)=> {
    const done = a.remainingMs <= 0;
    return `
      <div class="alarm-item" data-id="${a.id}">
        <div class="alarm-left">
          <span class="badge">#${i+1}</span>
          <span class="alarm-title">${formatKoreanHMS(a.lengthMs)}</span>
          <span class="alarm-remaining">남은 시간: ${formatHMS(a.remainingMs)}</span>
        </div>
        <div class="alarm-actions">
          <button class="btn" data-action="delete">삭제</button>
        </div>
      </div>`;
  }).join("");

  alarmList.querySelectorAll(".alarm-item .btn[data-action='delete']").forEach(btn=>{
    btn.onclick = (e)=>{
      const id = e.currentTarget.closest(".alarm-item").dataset.id;
      removeAlarm(id);
    };
  });
}

// 입력 처리
$("#addAlarmBtn").addEventListener("click", ()=>{
  const h = Math.max(0, parseInt($("#hours").value || "0", 10));
  const m = Math.max(0, parseInt($("#minutes").value || "0", 10));
  const s = Math.max(0, parseInt($("#seconds").value || "0", 10));

  const totalMs = (h*3600 + m*60 + s) * 1000;
  if (totalMs <= 0){
    limitMsg.textContent = "1초 이상으로 설정해 주세요.";
    return;
  }
  addAlarm(totalMs);
});

// FR5: 최근 길이로 즉시 시작하는 버튼
function updateRecentRow(){
  const last = parseInt(localStorage.getItem("lastAlarmMs") || "0", 10);
  if (!last || last <= 0){
    $("#recentText").textContent = "최근 설정된 길이: 없음";
    $("#quickStartBtn").disabled = true;
  }else{
    $("#recentText").textContent = `최근 설정된 길이: ${formatKoreanHMS(last)} (${formatHMS(last)})`;
    $("#quickStartBtn").disabled = false;
  }
}
$("#quickStartBtn").addEventListener("click", ()=>{
  const last = parseInt(localStorage.getItem("lastAlarmMs") || "0", 10);
  if (last > 0) addAlarm(last);
});
updateRecentRow();

paintAlarms();