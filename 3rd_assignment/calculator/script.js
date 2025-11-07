let current = "0";
let expression = "";   // FR2: 상단에 현재 입력 상황 띄움
let lastOperator = null;
let justEvaluated = false;
let lastRecord = "";   // FR5: 가장 최근 연산 기록 하나

const screen  = document.getElementById("screen");
const history = document.getElementById("history");
const toast   = document.getElementById("toast");

// 소수점 8번째 자리 반올림
function roundTo8(n) {
  // 매우 큰/작은 수 처리
  if (!isFinite(n)) return "오류";
  const rounded = Math.round(n * 1e8) / 1e8;
  // 문자열로 변환 시 불필요한 0 제거
  return Number(rounded.toString());
}

// 화면 갱신
function render() {
  screen.textContent = current;
  history.textContent = expression;
  fitFont();
}

function inputNumber(d) {
  if (justEvaluated) {
    expression = "";
    current = "0";
    justEvaluated = false;
  }
  if (current.replace("-", "").replace(".", "").length >= 16) return;

  if (current === "0") current = d;
  else current += d;
  render();
}

function inputDot() {
  if (justEvaluated) {
    expression = "";
    current = "0";
    justEvaluated = false;
  }
  if (!current.includes(".")) {
    current += current === "" ? "0." : ".";
    render();
  }
}

// 연산자 입력
function inputOperator(op) {
  if (current === "" && expression === "") return;

  // 직전에 =을 눌렀으면 현재 값으로 새 식 시작
  if (justEvaluated) {
    expression = current + " " + op + " ";
    justEvaluated = false;
    current = "";
    lastOperator = op;
    render();
    return;
  }

  // 현재 입력 수가 있을 때만 식에 추가
  if (current !== "") {
    expression += (expression ? "" : "") + current + " " + op + " ";
    current = "";
  } else {
    // 연속 연산자 입력 시 마지막 연산자 교체
    expression = expression.trim().replace(/[+\-*/]$/, op) + " ";
  }
  lastOperator = op;
  render();
}

// 계산(=)
function evaluate() {
  if (current === "" && expression === "") return;
  let expr = expression + (current !== "" ? current : "");

  expr = expr.trim().replace(/[+\-*/]$/, "");

  if (!expr) return;

  try {
    if (!/^[0-9+\-*/. ()]+$/.test(expr)) throw new Error("invalid");

    // 계산
    let result = Function(`"use strict"; return (${expr});`)();

    // 0으로 나누기 등 처리
    if (!isFinite(result)) throw new Error("inf");

    // 소수점 8번째 자리에서 반올림(숫자가 표시 영역 밖으로 나가지 않도록 8자리 정도로 제한을 두었습니다..!)
    result = roundTo8(result);

    // FR3: 결과 화면 표시
    lastRecord = `${expr} = ${result}`;
    expression = expr + " =";
    current = String(result);
    justEvaluated = true;
    render();
  } catch (e) {
    current = "오류";
    expression = "";
    justEvaluated = true;
    render();
  }
}

// C: 모두 초기화
function clearAll() {
  current = "0";
  expression = "";
  lastOperator = null;
  justEvaluated = false;
  render();
}

// CE: 현재 입력 초기화
function clearEntry() {
  current = "0";
  render();
}

// DEL: 한 글자 지우기
function delOne() {
  if (justEvaluated) return;
  if (current.length <= 1 || (current.length === 2 && current.startsWith("-"))) {
    current = "0";
  } else {
    current = current.slice(0, -1);
  }
  render();
}

// FR5: 최근 연산 기록 보기
function showLastRecord() {
  toast.textContent = lastRecord ? lastRecord : "최근 연산 기록이 없습니다.";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

document.querySelectorAll(".key").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.num) inputNumber(btn.dataset.num);
    else if (btn.dataset.dot) inputDot();
    else if (btn.dataset.op) inputOperator(btn.dataset.op);
    else if (btn.dataset.action === "equals") evaluate();
    else if (btn.dataset.action === "clear-all") clearAll();
    else if (btn.dataset.action === "clear-entry") clearEntry();
    else if (btn.dataset.action === "del") delOne();
  });
});

document.getElementById("btn-last").addEventListener("click", showLastRecord);

window.addEventListener("keydown", (e) => {
  const k = e.key;
  if (/\d/.test(k)) inputNumber(k);
  else if (k === ".") inputDot();
  else if (["+", "-", "*", "/"].includes(k)) inputOperator(k);
  else if (k === "Enter" || k === "=") evaluate();
  else if (k.toLowerCase() === "c") clearAll();
  else if (k === "Backspace") delOne();
});

render();