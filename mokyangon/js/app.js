/**
 * MokyangOn Core Router and View Manager (SPA Controller)
 */

const App = {
  init() {
    this.bindGlobalEvents();
    this.checkSession();
  },

  bindGlobalEvents() {
    // DB Reset button
    const btnReset = document.getElementById("btn-reset-db");
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        if (confirm("정말 Mock DB를 공장초기화 하시겠습니까?\n모든 회원가입 기록과 데이터가 원래대로 복구됩니다.")) {
          window.DB.reset();
          sessionStorage.clear();
          alert("데이터베이스가 초기화되었습니다. 페이지를 새로고침합니다.");
          window.location.reload();
        }
      });
    }

    // Role Switcher Simulator
    const roleSelect = document.getElementById("simulator-role-select");
    if (roleSelect) {
      roleSelect.addEventListener("change", (e) => {
        const selectedRole = e.target.value;
        const currentUser = window.Auth.getCurrentUser();
        const isOriginalAdmin = sessionStorage.getItem("mokyang_original_admin") === "true";

        if (currentUser && !isOriginalAdmin && currentUser.role !== "admin") {
          const userStatus = currentUser.approval_status === "pending" ? "pending" : currentUser.role;
          if (selectedRole !== "none" && selectedRole !== userStatus) {
            alert("관리자(또는 관리자 계정 시뮬레이션 중) 외에는 시뮬레이터 역할을 전환할 수 없으며 본인 계정 화면만 접근 가능합니다.");
            roleSelect.value = userStatus;
            return;
          }
        }

        if (selectedRole === "none") {
          window.Auth.logout();
          this.checkSession();
          this.showToast("로그아웃 상태로 전환했습니다.");
        } else {
          const user = window.Auth.simulateRoleLogin(selectedRole);
          if (user) {
            this.checkSession();
            this.showToast(`시뮬레이터: [${user.name}] (${selectedRole}) 계정으로 전환 완료`);
          } else {
            alert(`해당 역할(${selectedRole})을 가진 테스트 계정을 찾을 수 없습니다. DB를 초기화해 주세요.`);
          }
        }
      });
    }

    // Modal Close
    const modalClose = document.getElementById("mobile-modal-close");
    if (modalClose) {
      modalClose.addEventListener("click", () => {
        const modal = document.getElementById("mobile-modal");
        if (modal) modal.style.display = "none";
      });
    }
  },

  checkSession() {
    const user = window.Auth.getCurrentUser();
    const roleSelect = document.getElementById("simulator-role-select");

    // Sync simulator role select value
    if (roleSelect) {
      if (!user) {
        roleSelect.value = "none";
      } else if (user.approval_status === "pending") {
        roleSelect.value = "pending";
      } else {
        roleSelect.value = user.role;
      }
    }

    if (!user) {
      this.showAuthPage("login");
      return;
    }

    if (user.approval_status === "pending") {
      this.showPendingPage(user);
      return;
    }

    // Logged in & Approved users routing
    if (user.role === "admin") {
      this.showAdminView(user);
    } else {
      this.showMobileView(user);
    }
  },

  // 1. SHOW LOGIN / REGISTER PAGE
  showAuthPage(type) {
    const screen = document.getElementById("mobile-device-screen");
    const webContainer = document.getElementById("web-fullscreen-container");
    const mobileFrame = document.getElementById("mobile-device-frame");

    // Ensure we are inside the mobile frame for auth
    if (webContainer) webContainer.style.display = "none";
    if (mobileFrame) mobileFrame.style.display = "flex";

    if (!screen) return;

    if (type === "login") {
      screen.innerHTML = `
        <div class="auth-page">
          <div class="auth-header">
            <span class="simulator-logo" style="display:inline-block; font-size:24px; padding:6px 16px; margin-bottom:12px;">목양온</span>
            <h1>MokyangOn</h1>
            <p>파주목양교회 통합 플랫폼</p>
          </div>
          
          <form id="login-form" onsubmit="event.preventDefault(); App.handleLoginSubmit();">
            <div class="form-group">
              <label class="form-label">이메일 주소</label>
              <input type="email" id="login-email" class="input-field" placeholder="email@example.com" required value="member@mokyang.org">
            </div>
            
            <div class="form-group" style="margin-bottom: 24px;">
              <label class="form-label">비밀번호</label>
              <input type="password" id="login-password" class="input-field" placeholder="비밀번호 입력" required value="1111">
            </div>
            
            <button type="submit" class="btn btn-gold" style="margin-bottom: 16px;">로그인</button>
            <button type="button" class="btn btn-outline-gold" onclick="App.showAuthPage('register')">새 성도 회원가입</button>
          </form>

          <div style="margin-top:20px; font-size:12px; text-align:center; color:var(--color-gold-light); line-height:1.5;">
            💡 테스트를 위한 가이드 계정 (비번 1111)<br>
            성도: member@mokyang.org<br>
            소모임리더: leader@mokyang.org<br>
            관리자: admin@mokyang.org<br>
            교사: teacher@mokyang.org
          </div>
        </div>
      `;
    } else {
      screen.innerHTML = `
        <div class="auth-page">
          <div class="auth-header">
            <h1>성도 회원가입</h1>
            <p>목양온 플랫폼 가입 신청</p>
          </div>
          
          <form id="register-form" onsubmit="event.preventDefault(); App.handleRegisterSubmit();">
            <div class="form-group">
              <label class="form-label">이름</label>
              <input type="text" id="reg-name" class="input-field" placeholder="예: 김성도" required>
            </div>

            <div class="form-group">
              <label class="form-label">휴대폰 번호</label>
              <input type="tel" id="reg-phone" class="input-field" placeholder="010-XXXX-XXXX" required>
            </div>

            <div class="form-group">
              <label class="form-label">이메일 주소</label>
              <input type="email" id="reg-email" class="input-field" placeholder="email@example.com" required>
            </div>
            
            <div class="form-group" style="margin-bottom: 24px;">
              <label class="form-label">비밀번호</label>
              <input type="password" id="reg-password" class="input-field" placeholder="비밀번호 입력" required>
            </div>
            
            <button type="submit" class="btn btn-gold" style="margin-bottom: 16px;">가입 신청 완료</button>
            <button type="button" class="btn btn-secondary" onclick="App.showAuthPage('login')">이전으로 (로그인)</button>
          </form>
        </div>
      `;
    }
  },

  handleLoginSubmit() {
    const email = document.getElementById("login-email").value;
    const pass = document.getElementById("login-password").value;

    const res = window.Auth.login(email, pass);
    if (res.success) {
      this.showToast(`${res.user.name} 성도님, 로그인 환영합니다.`);
      this.checkSession();
    } else {
      alert(res.message);
    }
  },

  handleRegisterSubmit() {
    const name = document.getElementById("reg-name").value;
    const phone = document.getElementById("reg-phone").value;
    const email = document.getElementById("reg-email").value;
    const pass = document.getElementById("reg-password").value;

    const res = window.Auth.register(name, phone, email, pass);
    if (res.success) {
      alert("회원가입 신청이 정상 접수되었습니다. 관리자가 승인한 이후 사용이 가능합니다.");
      
      // Force session as pending user to show screen
      sessionStorage.setItem("mokyang_session", JSON.stringify(res.user));
      this.checkSession();
    } else {
      alert(res.message);
    }
  },

  // 2. SHOW PENDING PAGE
  showPendingPage(user) {
    const screen = document.getElementById("mobile-device-screen");
    const webContainer = document.getElementById("web-fullscreen-container");
    const mobileFrame = document.getElementById("mobile-device-frame");

    if (webContainer) webContainer.style.display = "none";
    if (mobileFrame) mobileFrame.style.display = "flex";

    if (!screen) return;

    screen.innerHTML = `
      <div class="pending-container">
        <div class="pending-icon">
          <i class="fas fa-user-lock"></i>
        </div>
        <h2 class="pending-title">가입 승인 대기 중</h2>
        <p class="pending-desc">
          <strong>${user.name}</strong> 성도님의 가입 신청이 완료되었습니다.<br>
          교회 관리자(담임목사)의 승인 확인 후<br>
          목양온 앱의 모든 컨텐츠 이용이 가능합니다.
        </p>
        
        <div style="background:var(--color-navy-bg); padding:15px; border-radius:10px; font-size:13px; line-height:1.6; margin-bottom: 24px; text-align:left; border:1px dashed var(--color-gold);">
          💡 <strong>빠른 시뮬레이션 방법:</strong><br>
          1. 우측 상단의 역할선택을 <strong>[admin]</strong>으로 전환합니다.<br>
          2. 대시보드의 '가입 신청' 목록에서 본인 계정의 <strong>[승인]</strong> 버튼을 누릅니다.<br>
          3. 다시 역할선택을 <strong>[member]</strong>나 <strong>[none](로그인화면)</strong>으로 바꾸어 승인 상태를 확인합니다.
        </div>

        <button class="btn btn-secondary" onclick="window.Auth.logout(); App.checkSession();">로그인 화면으로</button>
        
        <div class="pending-footer">
          파주목양교회 목양온 미디어지원팀
        </div>
      </div>
    `;
  },

  // 3. SHOW MOBILE USER VIEW
  showMobileView(user) {
    const webContainer = document.getElementById("web-fullscreen-container");
    const mobileFrame = document.getElementById("mobile-device-frame");

    if (webContainer) webContainer.style.display = "none";
    if (mobileFrame) mobileFrame.style.display = "flex";

    const screen = document.getElementById("mobile-device-screen");
    if (!screen) return;

    // Load Mobile frame HTML scaffold
    screen.innerHTML = `
      <div class="mobile-layout">
        <!-- 상단 헤더 -->
        <header class="mobile-header">
          <div class="mobile-header-title">
            <span class="simulator-logo">온</span>
            <strong>목양온</strong>
          </div>
          <div class="mobile-header-actions">
            <button class="icon-btn" id="mobile-noti-btn">
              <i class="fas fa-bell"></i>
              <span class="badge-dot" id="noti-badge" style="display:none;"></span>
            </button>
          </div>
        </header>

        <!-- 스크롤 내용 영역 -->
        <main class="mobile-content" id="mobile-main-content">
          <!-- Dynamically populated by mobile.js -->
        </main>

        <!-- 하단 탭바 -->
        <nav class="mobile-nav">
          <button class="nav-item active" data-tab="home">
            <i class="fas fa-home"></i>
            <span>홈</span>
          </button>
          <button class="nav-item" data-tab="group">
            <i class="fas fa-users"></i>
            <span>소모임</span>
          </button>
          <button class="nav-item" data-tab="education">
            <i class="fas fa-book-reader"></i>
            <span>양육</span>
          </button>
          <button class="nav-item" data-tab="sermon">
            <i class="fas fa-video"></i>
            <span>설교</span>
          </button>
          <button class="nav-item" data-tab="myinfo">
            <i class="fas fa-user"></i>
            <span>내 정보</span>
          </button>
        </nav>
      </div>
    `;

    // Start Mobile logic controller
    window.Mobile.init();
  },

  // 4. SHOW ADMIN VIEW (FULLSCREEN WEB VIEW)
  showAdminView(user) {
    const webContainer = document.getElementById("web-fullscreen-container");
    const mobileFrame = document.getElementById("mobile-device-frame");

    if (mobileFrame) mobileFrame.style.display = "none";
    if (webContainer) webContainer.style.display = "flex";

    webContainer.innerHTML = `
      <div class="admin-layout">
        <!-- 모바일 사이드바 백드롭 오버레이 -->
        <div class="admin-sidebar-overlay" id="admin-sidebar-overlay"></div>
        
        <!-- 사이드바 -->
        <aside class="admin-sidebar" id="admin-sidebar">
          <div class="admin-sidebar-logo">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="simulator-logo">온</span>
              <strong>목양온 관리자</strong>
            </div>
            <button class="admin-sidebar-close" id="admin-sidebar-close"><i class="fas fa-times"></i></button>
          </div>
          <ul class="admin-menu">
            <li class="admin-menu-item">
              <button class="admin-menu-btn active" data-menu="dashboard">
                <i class="fas fa-chart-line"></i> 대시보드 통계 / 승인
              </button>
            </li>
            <li class="admin-menu-item">
              <button class="admin-menu-btn" data-menu="members">
                <i class="fas fa-users-cog"></i> 성도 권한 설정
              </button>
            </li>
            <li class="admin-menu-item">
              <button class="admin-menu-btn" data-menu="groups">
                <i class="fas fa-cubes"></i> 소모임 관리
              </button>
            </li>
            <li class="admin-menu-item">
              <button class="admin-menu-btn" data-menu="create_group">
                <i class="fas fa-plus-circle"></i> 소모임 개설
              </button>
            </li>
            <li class="admin-menu-item">
              <button class="admin-menu-btn" data-menu="courses">
                <i class="fas fa-graduation-cap"></i> 양육 과정 관리
              </button>
            </li>
            <li class="admin-menu-item">
              <button class="admin-menu-btn" data-menu="create_course">
                <i class="fas fa-plus-circle"></i> 양육 과정 개설
              </button>
            </li>
            <li class="admin-menu-item">
              <button class="admin-menu-btn" data-menu="add_lesson">
                <i class="fas fa-video"></i> 양육 강의 업로드
              </button>
            </li>
            <li class="admin-menu-item">
              <button class="admin-menu-btn" data-menu="devotions">
                <i class="fas fa-edit"></i> 말씀 묵상지 등록
              </button>
            </li>
            <li class="admin-menu-item">
              <button class="admin-menu-btn" data-menu="sermons">
                <i class="fas fa-file-video"></i> 주일 설교영상 등록
              </button>
            </li>
            <li class="admin-menu-item">
              <button class="admin-menu-btn" data-menu="notices">
                <i class="fas fa-bullhorn"></i> 공지사항 등록 발송
              </button>
            </li>
            <li class="admin-menu-item">
              <button class="admin-menu-btn" data-menu="schedules">
                <i class="fas fa-calendar-alt"></i> 교회 일정 관리
              </button>
            </li>
          </ul>
          <div class="admin-sidebar-footer">
            <span style="font-size:12px; color:var(--color-gold-light);">MokyangOn Admin v1.0</span>
          </div>
        </aside>

        <!-- 메인 콘텐츠 영역 -->
        <main class="admin-main">
          <!-- 탑 헤더 -->
          <header class="admin-topbar">
            <div style="display:flex; align-items:center; gap:10px;">
              <button class="admin-hamburger" id="admin-hamburger"><i class="fas fa-bars"></i></button>
              <div class="admin-page-title" id="admin-page-title">📊 목양 관리 대시보드</div>
            </div>
            <div class="admin-profile">
              <div class="admin-user-info">
                <div class="admin-user-name">${user.name} 목사님</div>
                <div class="admin-user-role" style="display:none;">총괄 관리자</div>
              </div>
              <button class="admin-logout-btn" id="admin-logout-btn">🚪</button>
            </div>
          </header>
          
          <!-- 내용 스크롤 영역 -->
          <div class="admin-content" id="admin-main-content">
            <!-- Dynamically populated by admin.js -->
          </div>
        </main>
      </div>
    `;

    // Bind log out button
    document.getElementById("admin-logout-btn").addEventListener("click", () => {
      window.Auth.logout();
      this.checkSession();
    });

    // Mobile sidebar toggle events
    const hamburger = document.getElementById("admin-hamburger");
    const sidebarClose = document.getElementById("admin-sidebar-close");
    const sidebarOverlay = document.getElementById("admin-sidebar-overlay");
    const sidebar = document.getElementById("admin-sidebar");

    const toggleSidebar = (show) => {
      if (show) {
        sidebar.classList.add("open");
        sidebarOverlay.classList.add("show");
      } else {
        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("show");
      }
    };

    if (hamburger) hamburger.addEventListener("click", () => toggleSidebar(true));
    if (sidebarClose) sidebarClose.addEventListener("click", () => toggleSidebar(false));
    if (sidebarOverlay) sidebarOverlay.addEventListener("click", () => toggleSidebar(false));

    // Also close sidebar when menu items are clicked on mobile
    const menuButtons = document.querySelectorAll(".admin-menu-btn");
    menuButtons.forEach(btn => {
      btn.addEventListener("click", () => toggleSidebar(false));
    });

    // Start Admin logic controller
    window.Admin.init();
  },

  showToast(message) {
    const toast = document.getElementById("toast");
    if (toast) {
      toast.innerText = message;
      toast.style.display = "block";
      setTimeout(() => {
        toast.style.display = "none";
      }, 2000);
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

window.App = App;
