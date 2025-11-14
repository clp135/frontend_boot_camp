// 회원가입 모듈
(function () {
  const STORAGE_KEY = "registeredIds";

  const SignupApp = {
    state: {
      fixedIds: ["admin", "testuser", "guest"],
      lastCheckedId: "",
      idCheckPassed: false,
    },

    init() {
      this.cacheDom();
      this.bindEvents();
    },

    cacheDom() {
      this.form = document.querySelector("#signupForm");
      this.userIdInput = document.querySelector("#userId");
      this.checkIdBtn = document.querySelector("#checkIdBtn");
      this.idMessage = document.querySelector("#idMessage");

      this.pwInput = document.querySelector("#password");
      this.pwMessage = document.querySelector("#pwMessage");

      this.pwConfirmInput = document.querySelector("#passwordConfirm");
      this.pwConfirmMessage = document.querySelector("#pwConfirmMessage");

      this.nameInput = document.querySelector("#name");
      this.emailInput = document.querySelector("#email");
      this.agreeInput = document.querySelector("#agree");
    },

    bindEvents() {
      this.checkIdBtn.addEventListener(
        "click",
        this.handleCheckIdClick.bind(this)
      );

      this.userIdInput.addEventListener(
        "input",
        this.handleUserIdInput.bind(this)
      );

      this.pwInput.addEventListener("input", this.handlePwInput.bind(this));
      this.pwConfirmInput.addEventListener(
        "input",
        this.handlePwConfirmInput.bind(this)
      );

      this.form.addEventListener("submit", this.handleSubmit.bind(this));
    },

    // --- 상태 helpers ---
    getSavedIds() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    },

    saveId(id) {
      const ids = this.getSavedIds();
      ids.push(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    },

    isIdDuplicated(id) {
      const saved = this.getSavedIds();
      return (
        this.state.fixedIds.includes(id) ||
        saved.includes(id)
      );
    },

    // --- DOM helpers ---
    setMessage(el, text, type) {
      el.textContent = text;
      el.className = "form-message";

      if (!text) return;

      if (type === "error") {
        el.classList.add("form-message--error");
      } else if (type === "success") {
        el.classList.add("form-message--success");
      }
    },

    // --- 검증 helpers ---
    validatePassword(pw, id) {
      if (pw.length < 8 || pw.length > 16) {
        return "8~16자로 입력하세요.";
      }
      if (
        !/[A-Za-z]/.test(pw) ||
        !/[0-9]/.test(pw) ||
        !/[!@#$%^&*()_\-+=]/.test(pw)
      ) {
        return "영문, 숫자, 특수문자를 모두 포함해야 합니다.";
      }
      if (/\s/.test(pw)) {
        return "공백은 사용할 수 없습니다.";
      }

      if (id) {
        for (let len = 3; len <= id.length; len++) {
          for (let i = 0; i + len <= id.length; i++) {
            const sub = id.slice(i, i + len);
            if (sub.length >= 3 && pw.includes(sub)) {
              return "아이디와 3글자 이상 동일한 부분을 사용할 수 없습니다.";
            }
          }
        }
      }
      return "";
    },

    // --- 이벤트 핸들러 ---
    handleCheckIdClick() {
      const id = this.userIdInput.value.trim();

      if (!id) {
        this.setMessage(this.idMessage, "아이디를 입력하세요.", "error");
        this.state.idCheckPassed = false;
        return;
      }

      const idPattern = /^[a-z0-9]{4,12}$/;
      if (!idPattern.test(id)) {
        this.setMessage(
          this.idMessage,
          "영문 소문자/숫자 4~12자로 입력하세요.",
          "error"
        );
        this.state.idCheckPassed = false;
        return;
      }

      if (this.isIdDuplicated(id)) {
        this.setMessage(
          this.idMessage,
          "이미 사용 중인 아이디입니다.",
          "error"
        );
        this.state.idCheckPassed = false;
      } else {
        this.setMessage(
          this.idMessage,
          "사용 가능한 아이디입니다.",
          "success"
        );
        this.state.idCheckPassed = true;
        this.state.lastCheckedId = id;
      }
    },

    handleUserIdInput() {
      const currentId = this.userIdInput.value.trim();
      if (currentId !== this.state.lastCheckedId) {
        this.state.idCheckPassed = false;
        this.state.lastCheckedId = "";
        this.setMessage(this.idMessage, "", "");
      }
    },

    handlePwInput() {
      const id = this.userIdInput.value.trim();
      const pw = this.pwInput.value;
      const msg = this.validatePassword(pw, id);

      if (msg) {
        this.setMessage(this.pwMessage, msg, "error");
      } else if (pw) {
        this.setMessage(
          this.pwMessage,
          "사용 가능한 비밀번호입니다.",
          "success"
        );
      } else {
        this.setMessage(this.pwMessage, "", "");
      }

      this.updatePwConfirmMessage();
    },

    handlePwConfirmInput() {
      this.updatePwConfirmMessage();
    },

    updatePwConfirmMessage() {
      const pw = this.pwInput.value;
      const pw2 = this.pwConfirmInput.value;

      if (!pw2) {
        this.setMessage(this.pwConfirmMessage, "", "");
        return;
      }

      if (pw !== pw2) {
        this.setMessage(
          this.pwConfirmMessage,
          "비밀번호가 일치하지 않습니다.",
          "error"
        );
      } else {
        this.setMessage(
          this.pwConfirmMessage,
          "비밀번호가 일치합니다.",
          "success"
        );
      }
    },

    handleSubmit(event) {
      event.preventDefault();

      const id = this.userIdInput.value.trim();
      const pw = this.pwInput.value;
      const pw2 = this.pwConfirmInput.value;
      const name = this.nameInput.value.trim();
      const email = this.emailInput.value.trim();
      const agree = this.agreeInput.checked;

      if (!id || !pw || !pw2 || !name || !email) {
        alert("모든 필드를 입력하세요.");
        return;
      }

      if (!this.state.idCheckPassed || id !== this.state.lastCheckedId) {
        alert("아이디 중복 확인을 완료하세요.");
        return;
      }

      const pwError = this.validatePassword(pw, id);
      if (pwError) {
        alert("비밀번호 규칙을 확인하세요.");
        return;
      }

      if (pw !== pw2) {
        alert("비밀번호가 일치하지 않습니다.");
        return;
      }

      if (!agree) {
        alert("약관에 동의해야 합니다.");
        return;
      }

      this.saveId(id);
      window.location.href = "success.html";
    },
  };

  document.addEventListener("DOMContentLoaded", () => {
    SignupApp.init();
  });
})();