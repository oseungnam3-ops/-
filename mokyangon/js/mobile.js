/**
 * MokyangOn Subscriber Mobile View Controller
 */

const Mobile = {
  activeTab: "home", // home, group, education, sermon, myinfo
  selectedGroupId: null,
  selectedCourseId: null,
  selectedLessonId: null,

  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // Tab Bar click handling
    document.querySelectorAll(".nav-item").forEach(item => {
      item.addEventListener("click", (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Notification Icon
    const notiBtn = document.getElementById("mobile-noti-btn");
    if (notiBtn) {
      notiBtn.addEventListener("click", () => this.showNotificationsModal());
    }
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll(".nav-item").forEach(item => {
      if (item.dataset.tab === tab) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
    this.render();
  },

  render() {
    const contentArea = document.getElementById("mobile-main-content");
    if (!contentArea) return;
    
    // Clear content
    contentArea.innerHTML = "";
    
    // Show update badge count on topbar bell icon
    this.updateNotificationBadge();

    // Render corresponding screen
    switch (this.activeTab) {
      case "home":
        this.renderHomeScreen(contentArea);
        break;
      case "group":
        this.renderGroupScreen(contentArea);
        break;
      case "education":
        this.renderEducationScreen(contentArea);
        break;
      case "sermon":
        this.renderSermonScreen(contentArea);
        break;
      case "myinfo":
        this.renderMyInfoScreen(contentArea);
        break;
      default:
        this.renderHomeScreen(contentArea);
    }
  },

  updateNotificationBadge() {
    const user = window.Auth.getCurrentUser();
    if (!user) return;
    
    const unread = window.DB.query("notifications", n => n.user_id === user.id && !n.is_read);
    const badge = document.getElementById("noti-badge");
    if (badge) {
      if (unread.length > 0) {
        badge.style.display = "block";
      } else {
        badge.style.display = "none";
      }
    }
  },

  // 1. HOME SCREEN
  renderHomeScreen(container) {
    const user = window.Auth.getCurrentUser();
    
    // Get local date string YYYY-MM-DD
    const offset = new Date().getTimezoneOffset() * 60000;
    const todayStr = new Date(Date.now() - offset).toISOString().slice(0, 10);
    
    let todayDevotion = window.DB.query("devotions", d => d.date === todayStr)[0];
    if (!todayDevotion) {
      const allDevotions = window.DB.get("devotions");
      if (allDevotions.length > 0) {
        // Sort by date descending, then created_at descending
        allDevotions.sort((a, b) => {
          const dateCompare = b.date.localeCompare(a.date);
          if (dateCompare !== 0) return dateCompare;
          return (b.created_at || "").localeCompare(a.created_at || "");
        });
        todayDevotion = allDevotions[0];
      }
    }
    
    // Check if devotion has response from current user
    const hasResponded = todayDevotion ? window.DB.query("devotion_responses", r => r.devotion_id === todayDevotion.id && r.user_id === user.id).length > 0 : false;

    // Get active course enrollment
    const activeEnrollment = window.DB.query("course_enrollments", e => e.user_id === user.id && e.status === "enrolled")[0];
    let courseInfoHtml = "";
    if (activeEnrollment) {
      const course = window.DB.query("courses", c => c.id === activeEnrollment.course_id)[0];
      if (course) {
        courseInfoHtml = `
          <div class="m-card" onclick="Mobile.switchTab('education')">
            <div class="m-card-title">📖 이어서 학습하기 <span style="font-size: 14px; color: var(--color-gold-dark);">바로가기</span></div>
            <div class="m-card-subtitle" style="font-weight: 700;">${course.title}</div>
            <div style="font-size: var(--font-size-sm); color: var(--color-gray-600); margin-bottom: 8px;">현재 강의 진도율: ${activeEnrollment.progress_rate}% 완료</div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill gold" style="width: ${activeEnrollment.progress_rate}%;"></div>
            </div>
          </div>
        `;
      }
    } else {
      courseInfoHtml = `
        <div class="m-card" onclick="Mobile.switchTab('education')" style="border: 1px dashed var(--color-gold); background: rgba(197, 168, 128, 0.05);">
          <div class="m-card-title">📖 추천 양육 과정</div>
          <div style="font-size: var(--font-size-sm); line-height: 1.5; color: var(--color-gray-600); margin-bottom: 12px;">교회의 필수 신앙 교육 과정인 <strong>'새가족반'</strong>에 도전하여 건강한 성장을 이뤄 보세요!</div>
          <button class="btn btn-outline-gold" style="padding: 8px; min-height: 38px; font-size: 14px;">양육 과정 둘러보기</button>
        </div>
      `;
    }

    // Get latest sermon
    const sermons = window.DB.get("sermon_videos");
    const latestSermon = sermons.sort((a,b) => new Date(b.sermon_date) - new Date(a.sermon_date))[0];

    // Get active small groups
    const myGroupMemberships = window.DB.query("small_group_members", m => m.user_id === user.id && m.status === "approved");
    let myGroupsHtml = "";
    if (myGroupMemberships.length > 0) {
      myGroupsHtml = `<div class="m-card-title">👥 내가 참여 중인 소모임</div>`;
      myGroupMemberships.forEach(m => {
        const group = window.DB.query("small_groups", g => g.id === m.group_id)[0];
        if (group && group.is_active) {
          myGroupsHtml += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px 0; border-bottom: 1px solid var(--color-gray-200); cursor: pointer;" onclick="Mobile.openGroupDetail('${group.id}')">
              <div>
                <span class="group-tag" style="margin-right:8px;">${group.category}</span>
                <strong style="font-size: var(--font-size-base);">${group.title}</strong>
              </div>
              <span style="font-size: var(--font-size-sm); color: var(--color-gray-600);">${group.day_of_week} ${group.time}</span>
            </div>
          `;
        }
      });
    } else {
      myGroupsHtml = `
        <div class="m-card-title">👥 참여 중인 소모임 없음</div>
        <div style="font-size: var(--font-size-sm); color: var(--color-gray-600); margin-bottom: 10px;">함께 삶을 나눌 따뜻한 목장이나 관심 모임에 가입해 보세요.</div>
        <button class="btn btn-primary" onclick="Mobile.switchTab('group')" style="padding: 8px; min-height: 38px; font-size: 14px;">소모임 탐색하기</button>
      `;
    }

    // Notices list (top 2, filtered by role and sorted by date descending)
    const allNotices = window.DB.get("notices");
    const userRole = user.role;
    const filteredNotices = allNotices.filter(n => {
      if (n.target_role === "all") return true;
      if (n.target_role === "leader_teacher") {
        return userRole === "leader" || userRole === "teacher" || userRole === "admin";
      }
      return false;
    });
    filteredNotices.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

    let noticesHtml = "";
    filteredNotices.slice(0, 2).forEach(n => {
      noticesHtml += `
        <div style="margin-bottom: 10px; cursor: pointer; border-bottom: 1px solid var(--color-gray-100); padding-bottom: 8px;" onclick="Mobile.showNoticeDetail('${n.id}')">
          <div style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${n.title}</div>
          <div style="font-size: var(--font-size-xs); color: var(--color-gray-600); text-align: right; margin-top: 4px;">${(n.created_at || "").slice(0, 10)}</div>
        </div>
      `;
    });

    // Devotion status / Stats
    const totalLectures = window.DB.query("lesson_progress", p => p.user_id === user.id && p.is_completed).length;
    const totalDevotions = window.DB.query("devotion_responses", r => r.user_id === user.id).length;
    const totalGroups = myGroupMemberships.length;

    container.innerHTML = `
      <!-- 오늘의 말씀 배너 -->
      ${todayDevotion ? `
        <div class="m-card today-verse-card">
          <div class="today-verse-title">✨ 오늘의 말씀 묵상 (${todayDevotion.date})</div>
          <div class="today-verse-text">"${todayDevotion.scripture.split('\n')[0].replace(/^\d+\s*/, '')}"</div>
          <div class="today-verse-ref">${todayDevotion.title} (${todayDevotion.bible_text})</div>
          
          <button class="btn btn-gold" id="btn-home-devotion" style="margin-top: 15px; padding: 12px 16px; font-size: 16px;">
            ${hasResponded ? "📝 오늘 묵상 기록 보기/수정" : "✏️ 말씀 묵상 작성하기"}
          </button>
        </div>
      ` : ""}

      <!-- 수강 진도 -->
      ${courseInfoHtml}

      <!-- 내 소모임 -->
      <div class="m-card">
        ${myGroupsHtml}
      </div>

      <!-- 설교 영상 바로가기 -->
      ${latestSermon ? `
        <div class="m-card" onclick="Mobile.switchTab('sermon')">
          <div class="m-card-title">🎥 주일 설교 영상 <span style="font-size: 14px; color: var(--color-gold-dark);">바로보기</span></div>
          <div style="display:flex; gap:12px; align-items:center;">
            <div style="width: 100px; height: 60px; background: #000; border-radius: 6px; display:flex; align-items:center; justify-content:center; color:white; font-size:12px;">
              <i class="fas fa-play-circle" style="font-size:24px; color:var(--color-gold);"></i>
            </div>
            <div>
              <div style="font-size:var(--font-size-sm); font-weight:700; color:var(--color-gray-800);">${latestSermon.title}</div>
              <div style="font-size:var(--font-size-xs); color:var(--color-gray-600); margin-top:2px;">설교자: ${latestSermon.preacher} | ${latestSermon.sermon_date}</div>
            </div>
          </div>
        </div>
      ` : ""}

      <!-- 교회 공지사항 -->
      <div class="m-card">
        <div class="m-card-title">📢 교회 공지사항</div>
        <div style="margin-top:10px;">
          ${noticesHtml || "<div style='font-size:var(--font-size-sm); color:var(--color-gray-600);'>등록된 공지사항이 없습니다.</div>"}
        </div>
      </div>

      <!-- 내 신앙 성장 현황 -->
      <div class="m-card">
        <div class="m-card-title">📈 나의 신앙 훈련 현황</div>
        <div class="growth-badge-container">
          <div class="growth-badge">
            <div class="growth-badge-value">${totalDevotions}회</div>
            <div class="growth-badge-label">말씀묵상</div>
          </div>
          <div class="growth-badge">
            <div class="growth-badge-value">${totalLectures}강</div>
            <div class="growth-badge-label">양육수강</div>
          </div>
          <div class="growth-badge">
            <div class="growth-badge-value">${totalGroups}개</div>
            <div class="growth-badge-label">참여소모임</div>
          </div>
        </div>
      </div>
      
      <!-- 교회 일정 바로가기 위젯 -->
      <div class="m-card">
        <div class="m-card-title">📅 이번 주 교회 일정</div>
        <div id="home-calendar-events"></div>
        <button class="btn btn-outline-gold" id="btn-show-calendar" style="margin-top: 10px; padding: 8px; min-height: 38px; font-size: 14px;">전체 캘린더 보기</button>
      </div>
    `;

    // Bind home page buttons
    const devotionBtn = document.getElementById("btn-home-devotion");
    if (devotionBtn && todayDevotion) {
      devotionBtn.addEventListener("click", () => this.openDevotionModal(todayDevotion.id));
    }
    const calendarBtn = document.getElementById("btn-show-calendar");
    if (calendarBtn) {
      calendarBtn.addEventListener("click", () => this.showCalendarModal());
    }

    this.renderHomeCalendarEvents();
  },

  renderHomeCalendarEvents() {
    const listDiv = document.getElementById("home-calendar-events");
    if (!listDiv) return;

    const offset = new Date().getTimezoneOffset() * 60000;
    const todayStr = new Date(Date.now() - offset).toISOString().slice(0, 10);

    const allSchedules = window.DB.get("church_schedules");
    let upcoming = allSchedules.filter(s => s.date >= todayStr);
    
    // Fallback if no future events for simulation
    if (upcoming.length === 0) {
      upcoming = allSchedules;
    }

    // Sort by date ascending, then time ascending
    upcoming.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    function getDayOfWeek(dateStr) {
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      const d = new Date(dateStr);
      return days[d.getDay()];
    }

    let html = "";
    upcoming.slice(0, 3).forEach(ev => {
      const dayOfWeek = getDayOfWeek(ev.date);
      const dateFormatted = `${ev.date.slice(5, 10).replace('-', '/')} (${dayOfWeek}) ${ev.time}`;
      
      html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 8px 0; border-bottom: 1px solid var(--color-gray-100); font-size:14px;">
          <div>
            <strong>${ev.title}</strong>
            <div style="font-size:11px; color:var(--color-gray-600);">${ev.description}</div>
          </div>
          <span style="color:var(--color-gold-dark); font-weight:700;">${dateFormatted}</span>
        </div>
      `;
    });

    if (upcoming.length === 0) {
      html = `<div style="text-align:center; padding:10px; font-size:13px; color:var(--color-gray-600);">등록된 일정이 없습니다.</div>`;
    }
    listDiv.innerHTML = html;
  },

  // 2. SMALL GROUP SCREEN
  renderGroupScreen(container) {
    const categories = ["전체", "목장", "순모임", "청년모임", "성경공부", "기도모임", "봉사팀", "축구모임", "새가족모임"];
    let catTabsHtml = "";
    
    // Active category filter state
    if (!this.groupFilter) this.groupFilter = "전체";
    
    categories.forEach(cat => {
      catTabsHtml += `
        <button class="cat-tab ${this.groupFilter === cat ? "active" : ""}" data-category="${cat}">
          ${cat}
        </button>
      `;
    });

    container.innerHTML = `
      <div class="category-tabs">
        ${catTabsHtml}
      </div>
      
      <!-- 소모임 생성 버튼 (소모임 리더 및 관리자 권한 전용) -->
      ${this.canCreateGroup() ? `
        <button class="btn btn-gold" id="btn-create-group" style="margin-bottom: 16px; padding: 10px; min-height: 40px; font-size: 15px;">
          ➕ 새 소모임 개설하기
        </button>
      ` : ""}

      <div id="group-list-container"></div>
    `;

    // Bind category filter tabs click
    container.querySelectorAll(".cat-tab").forEach(tab => {
      tab.addEventListener("click", (e) => {
        this.groupFilter = e.currentTarget.dataset.category;
        container.querySelectorAll(".cat-tab").forEach(t => t.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.renderGroupList();
      });
    });

    // Bind create group button
    const createBtn = document.getElementById("btn-create-group");
    if (createBtn) {
      createBtn.addEventListener("click", () => this.openCreateGroupModal());
    }

    this.renderGroupList();
  },

  canCreateGroup() {
    const user = window.Auth.getCurrentUser();
    return user && (user.role === "leader" || user.role === "admin" || user.role === "teacher");
  },

  renderGroupList() {
    const listDiv = document.getElementById("group-list-container");
    if (!listDiv) return;

    const user = window.Auth.getCurrentUser();
    let groups = window.DB.get("small_groups");
    
    // Filter active groups
    groups = groups.filter(g => g.is_active);

    if (this.groupFilter !== "전체") {
      groups = groups.filter(g => g.category === this.groupFilter);
    }

    if (groups.length === 0) {
      listDiv.innerHTML = `<div style="text-align:center; padding: 40px; color:var(--color-gray-600);">해당 카테고리의 소모임이 없습니다.</div>`;
      return;
    }

    let html = "";
    groups.forEach(g => {
      const leader = window.DB.query("users", u => u.id === g.leader_id)[0] || { name: "미지정" };
      const members = window.DB.query("small_group_members", m => m.group_id === g.id && m.status === "approved");
      const myMembership = window.DB.query("small_group_members", m => m.group_id === g.id && m.user_id === user.id)[0];
      
      let btnLabel = "신청하기";
      let btnClass = "btn-gold";
      let isDisabled = false;

      if (myMembership) {
        if (myMembership.status === "approved") {
          btnLabel = "참가 중 (상세보기)";
          btnClass = "btn-primary";
        } else if (myMembership.status === "pending") {
          btnLabel = "승인 대기 중";
          btnClass = "btn-secondary";
          isDisabled = true;
        } else if (myMembership.status === "rejected") {
          btnLabel = "신청 거절됨";
          btnClass = "btn-secondary";
          isDisabled = true;
        }
      } else if (members.length >= g.capacity) {
        btnLabel = "정원 초과";
        btnClass = "btn-secondary";
        isDisabled = true;
      }

      html += `
        <div class="m-card" style="cursor: pointer;" onclick="Mobile.openGroupDetail('${g.id}')">
          <div class="m-card-title">
            <span>${g.title}</span>
            <span class="group-tag">${g.category}</span>
          </div>
          <div class="group-info-grid">
            <div class="group-info-label">리더</div>
            <div class="group-info-value">${leader.name}</div>
            
            <div class="group-info-label">시간/장소</div>
            <div class="group-info-value">${g.day_of_week} ${g.time} / ${g.location}</div>
            
            <div class="group-info-label">대상</div>
            <div class="group-info-value">${g.target}</div>
            
            <div class="group-info-label">참여인원</div>
            <div class="group-info-value"><span class="group-capacity">${members.length}</span> / ${g.capacity}명</div>
          </div>
          
          <button class="btn ${btnClass}" ${isDisabled ? "disabled" : ""} 
            onclick="event.stopPropagation(); Mobile.handleGroupAction('${g.id}', '${myMembership ? myMembership.status : "none"}')">
            ${btnLabel}
          </button>
        </div>
      `;
    });
    listDiv.innerHTML = html;
  },

  handleGroupAction(groupId, membershipStatus) {
    const user = window.Auth.getCurrentUser();
    if (membershipStatus === "none") {
      // Apply for small group
      const newMembership = {
        group_id: groupId,
        user_id: user.id,
        status: "pending",
        joined_at: new Date().toISOString()
      };
      window.DB.insert("small_group_members", newMembership);
      
      // Notify Leader
      const group = window.DB.query("small_groups", g => g.id === groupId)[0];
      if (group) {
        const noti = {
          user_id: group.leader_id,
          title: "소모임 신청 알림",
          message: `[${group.title}] 모임에 ${user.name} 성도님이 가입을 신청했습니다. 승인해 주세요.`,
          is_read: false
        };
        window.DB.insert("notifications", noti);
      }

      this.showToast("소모임 신청이 완료되었습니다. 리더의 승인을 기다립니다.");
      this.render();
    } else if (membershipStatus === "approved") {
      this.openGroupDetail(groupId);
    }
  },

  openGroupDetail(groupId) {
    this.selectedGroupId = groupId;
    const group = window.DB.query("small_groups", g => g.id === groupId)[0];
    if (!group) return;

    const user = window.Auth.getCurrentUser();
    const leader = window.DB.query("users", u => u.id === group.leader_id)[0] || { name: "미지정" };
    const members = window.DB.query("small_group_members", m => m.group_id === group.id && m.status === "approved");
    const isLeaderOfThisGroup = (group.leader_id === user.id) || (user.role === "admin");
    const myMembership = window.DB.query("small_group_members", m => m.group_id === group.id && m.user_id === user.id)[0];
    const isMemberOfThisGroup = myMembership && myMembership.status === "approved";

    // Build modal detail layout
    const modalContent = `
      <div style="font-size: var(--font-size-sm); margin-bottom: 12px; font-weight:700; color:var(--color-gold-dark);">${group.category}</div>
      <div style="font-size: var(--font-size-md); font-weight:700; color:var(--color-navy); margin-bottom: 8px;">${group.title}</div>
      <p style="font-size: var(--font-size-sm); color: var(--color-gray-600); margin-bottom: 16px; line-height: 1.5;">${group.description}</p>
      
      <div class="group-info-grid" style="background:var(--color-navy-bg); padding:12px; border-radius:8px; margin-bottom: 16px;">
        <div class="group-info-label">모임 리더</div>
        <div class="group-info-value">${leader.name}</div>
        <div class="group-info-label">모임 시간</div>
        <div class="group-info-value">${group.day_of_week} ${group.time}</div>
        <div class="group-info-label">모임 장소</div>
        <div class="group-info-value">${group.location}</div>
        <div class="group-info-label">모임 대상</div>
        <div class="group-info-value">${group.target}</div>
        <div class="group-info-label">정원 현황</div>
        <div class="group-info-value">${members.length}명 / ${group.capacity}명</div>
      </div>

      <!-- 리더 전용 퀵 출석/공지 패널 -->
      ${isLeaderOfThisGroup ? `
        <div style="background: rgba(197, 168, 128, 0.1); border:1px solid var(--color-gold); padding:12px; border-radius:8px; margin-bottom:16px;">
          <h4 style="font-size:14px; color:var(--color-navy); margin-bottom:8px;">🛠️ 모임 리더 관리 메뉴</h4>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
            <button class="btn btn-primary" onclick="Mobile.openAttendanceCheckModal('${group.id}')" style="padding:6px; min-height:36px; font-size:13px;">👥 출석 체크</button>
            <button class="btn btn-gold" onclick="Mobile.openAddGroupPostModal('${group.id}')" style="padding:6px; min-height:36px; font-size:13px;">📝 공지/글 등록</button>
          </div>
        </div>
      ` : ""}

      <!-- 탭 목록 -->
      <div class="detail-tab-header">
        <button class="detail-tab-btn active" data-tab-content="group-tab-notice" onclick="Mobile.switchDetailTab(event)">공지</button>
        <button class="detail-tab-btn" data-tab-content="group-tab-prayer" onclick="Mobile.switchDetailTab(event)">기도제목</button>
        <button class="detail-tab-btn" data-tab-content="group-tab-review" onclick="Mobile.switchDetailTab(event)">후기</button>
        <button class="detail-tab-btn" data-tab-content="group-tab-attendance" onclick="Mobile.switchDetailTab(event)">내출석</button>
      </div>

      <!-- 탭 컨텐츠 -->
      <div id="group-tab-notice" class="detail-tab-content active"></div>
      <div id="group-tab-prayer" class="detail-tab-content"></div>
      <div id="group-tab-review" class="detail-tab-content"></div>
      <div id="group-tab-attendance" class="detail-tab-content"></div>
      
      <!-- 일반 성도 글쓰기 버튼 (멤버일 때만 노출) -->
      ${isMemberOfThisGroup && !isLeaderOfThisGroup ? `
        <button class="btn btn-outline-gold" onclick="Mobile.openAddGroupPostModal('${group.id}')" style="margin-top: 15px; padding: 10px; min-height: 40px; font-size: 14px;">
          ✏️ 우리 모임에 글 쓰기 (기도제목/후기)
        </button>
      ` : ""}
      
      ${!isMemberOfThisGroup && !isLeaderOfThisGroup ? `
        <button class="btn btn-gold" style="margin-top:15px;" 
          onclick="Mobile.handleGroupAction('${group.id}', 'none'); Mobile.closeModal();">
          🙋‍♀️ 모임 가입 신청하기
        </button>
      ` : ""}
    `;

    this.showModal("소모임 세부 정보", modalContent);
    this.renderGroupTabContent(groupId);
  },

  switchDetailTab(e) {
    const targetId = e.currentTarget.dataset.tabContent;
    document.querySelectorAll(".detail-tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".detail-tab-content").forEach(c => c.classList.remove("active"));
    
    e.currentTarget.classList.add("active");
    const targetContent = document.getElementById(targetId);
    if (targetContent) targetContent.classList.add("active");
  },

  renderGroupTabContent(groupId) {
    const noticesDiv = document.getElementById("group-tab-notice");
    const prayersDiv = document.getElementById("group-tab-prayer");
    const reviewsDiv = document.getElementById("group-tab-review");
    const attendanceDiv = document.getElementById("group-tab-attendance");

    if (!noticesDiv || !prayersDiv || !reviewsDiv || !attendanceDiv) return;

    const user = window.Auth.getCurrentUser();
    const posts = window.DB.query("small_group_posts", p => p.group_id === groupId);
    
    // Sort by newest
    posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const renderFeed = (postType, container) => {
      const typePosts = posts.filter(p => p.post_type === postType);
      if (typePosts.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; font-size:14px; color:var(--color-gray-600);">등록된 글이 없습니다.</div>`;
        return;
      }
      
      let html = "";
      typePosts.forEach(p => {
        const author = window.DB.query("users", u => u.id === p.author_id)[0] || { name: "알수없음" };
        html += `
          <div class="feed-item">
            <div class="feed-meta">
              <strong>${author.name} (${p.post_type === "notice" ? "리더" : "성도"})</strong>
              <span>${p.created_at.slice(0, 10)}</span>
            </div>
            <h4 style="font-size:15px; font-weight:700; margin-bottom:4px; color:var(--color-navy);">${p.title}</h4>
            <div class="feed-content">${p.content.replace(/\n/g, '<br>')}</div>
          </div>
        `;
      });
      container.innerHTML = html;
    };

    renderFeed("notice", noticesDiv);
    renderFeed("prayer", prayersDiv);
    renderFeed("review", reviewsDiv);

    // Render attendance for logged user
    const attList = window.DB.query("small_group_attendance", a => a.group_id === groupId && a.user_id === user.id);
    if (attList.length === 0) {
      attendanceDiv.innerHTML = `<div style="text-align:center; padding:20px; font-size:14px; color:var(--color-gray-600);">출석 데이터가 없습니다.</div>`;
    } else {
      let html = `<ul style="list-style:none; padding:0;">`;
      attList.forEach(a => {
        const statusText = a.status === "present" ? "✅ 출석" : (a.status === "absent" ? "❌ 결석" : "⚠️ 지각");
        html += `
          <li style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--color-gray-200); font-size:14px;">
            <span>${a.meeting_date} 모임</span>
            <strong>${statusText} ${a.memo ? `(${a.memo})` : ""}</strong>
          </li>
        `;
      });
      html += `</ul>`;
      attendanceDiv.innerHTML = html;
    }
  },

  openAttendanceCheckModal(groupId) {
    const members = window.DB.query("small_group_members", m => m.group_id === groupId && m.status === "approved");
    const todayStr = new Date().toISOString().slice(0, 10);
    
    let membersHtml = "";
    if (members.length === 0) {
      membersHtml = `<p style="text-align:center; font-size:14px;">모임에 소속된 성도가 없습니다.</p>`;
    } else {
      members.forEach(m => {
        const user = window.DB.query("users", u => u.id === m.user_id)[0];
        if (user) {
          membersHtml += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--color-gray-200);">
              <div>
                <strong>${user.name}</strong>
                <div style="font-size:11px; color:var(--color-gray-600);">${user.phone}</div>
              </div>
              <div style="display:flex; gap:6px;">
                <select class="admin-select" id="att-select-${user.id}">
                  <option value="present">출석</option>
                  <option value="absent">결석</option>
                  <option value="late">지각</option>
                </select>
                <input type="text" id="att-memo-${user.id}" placeholder="메모(선택)" style="font-size:12px; padding:4px; width:100px; border:1px solid var(--color-gray-300); border-radius:4px;">
              </div>
            </div>
          `;
        }
      });
    }

    const modalContent = `
      <div class="form-group">
        <label class="form-label" style="color:var(--color-gray-800);">📅 모임 날짜</label>
        <input type="date" id="att-date-input" value="${todayStr}" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
      </div>
      <div style="max-height: 250px; overflow-y:auto; margin-bottom: 20px;">
        ${membersHtml}
      </div>
      <button class="btn btn-primary" onclick="Mobile.saveAttendance('${groupId}')">출석 저장하기</button>
    `;
    this.showModal("출석 체크", modalContent);
  },

  saveAttendance(groupId) {
    const date = document.getElementById("att-date-input").value;
    const members = window.DB.query("small_group_members", m => m.group_id === groupId && m.status === "approved");

    members.forEach(m => {
      const select = document.getElementById(`att-select-${m.user_id}`);
      const memoInput = document.getElementById(`att-memo-${m.user_id}`);
      if (select) {
        const newAtt = {
          group_id: groupId,
          user_id: m.user_id,
          meeting_date: date,
          status: select.value,
          memo: memoInput ? memoInput.value : ""
        };
        // Check if attendance already checked for this user on this day
        const existing = window.DB.query("small_group_attendance", a => a.group_id === groupId && a.user_id === m.user_id && a.meeting_date === date)[0];
        if (existing) {
          window.DB.update("small_group_attendance", existing.id, newAtt);
        } else {
          window.DB.insert("small_group_attendance", newAtt);
        }
      }
    });

    this.showToast("출석부가 업데이트되었습니다.");
    this.closeModal();
    // Reopen group detail to refresh tabs
    setTimeout(() => this.openGroupDetail(groupId), 100);
  },

  openAddGroupPostModal(groupId) {
    const user = window.Auth.getCurrentUser();
    const group = window.DB.query("small_groups", g => g.id === groupId)[0];
    const isLeader = group && group.leader_id === user.id;

    const modalContent = `
      <div class="form-group">
        <label class="form-label" style="color:var(--color-gray-800);">글 종류</label>
        <select id="post-type" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
          ${isLeader ? `<option value="notice">📢 모임 공지사항</option>` : ""}
          <option value="prayer">🙏 기도제목 나누기</option>
          <option value="review">😊 모임 은혜 후기</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" style="color:var(--color-gray-800);">제목</label>
        <input type="text" id="post-title" placeholder="제목을 입력하세요" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
      </div>
      <div class="form-group">
        <label class="form-label" style="color:var(--color-gray-800);">내용</label>
        <textarea id="post-content" placeholder="은혜로운 나눔을 기록해 주세요..." style="width:100%; height:120px; padding:10px; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px; resize:none; font-family:var(--font-main);"></textarea>
      </div>
      <button class="btn btn-primary" onclick="Mobile.saveGroupPost('${groupId}')">작성 완료</button>
    `;
    this.showModal("소모임 글 쓰기", modalContent);
  },

  saveGroupPost(groupId) {
    const user = window.Auth.getCurrentUser();
    const type = document.getElementById("post-type").value;
    const title = document.getElementById("post-title").value;
    const content = document.getElementById("post-content").value;

    if (!title || !content) {
      alert("제목과 내용을 입력해 주세요.");
      return;
    }

    const newPost = {
      group_id: groupId,
      title: title,
      content: content,
      post_type: type,
      author_id: user.id
    };

    window.DB.insert("small_group_posts", newPost);
    this.showToast("글이 등록되었습니다.");
    this.closeModal();
    // Reopen detail
    setTimeout(() => this.openGroupDetail(groupId), 100);
  },

  openCreateGroupModal() {
    const user = window.Auth.getCurrentUser();
    const modalContent = `
      <div class="form-group">
        <label class="form-label" style="color:var(--color-gray-800);">소모임 명</label>
        <input type="text" id="cg-title" placeholder="예: 축구 모임, 에스더 목장" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
      </div>
      <div class="form-group-row">
        <div class="form-group">
          <label class="form-label" style="color:var(--color-gray-800);">카테고리</label>
          <input type="text" id="cg-category" placeholder="예: 목장, 순모임, 축구" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
        </div>
        <div class="form-group">
          <label class="form-label" style="color:var(--color-gray-800);">정원(명)</label>
          <input type="number" id="cg-capacity" value="10" min="2" max="100" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
        </div>
      </div>
      <div class="form-group-row">
        <div class="form-group">
          <label class="form-label" style="color:var(--color-gray-800);">지정 리더</label>
          <input type="text" id="cg-leader" placeholder="예: 박집사 (미입력 시 본인)" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
        </div>
        <div class="form-group">
          <label class="form-label" style="color:var(--color-gray-800);">모임 요일</label>
          <select id="cg-day" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
            <option value="주일">주일</option>
            <option value="월요일">월요일</option>
            <option value="화요일">화요일</option>
            <option value="수요일">수요일</option>
            <option value="목요일">목요일</option>
            <option value="금요일">금요일</option>
            <option value="토요일">토요일</option>
          </select>
        </div>
      </div>
      <div class="form-group-row">
        <div class="form-group" style="grid-column: span 2;">
          <label class="form-label" style="color:var(--color-gray-800);">시간</label>
          <input type="text" id="cg-time" placeholder="예: 20:00" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" style="color:var(--color-gray-800);">모임 장소</label>
        <input type="text" id="cg-location" placeholder="예: 교회 2층, 비전홀" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
      </div>
      <div class="form-group">
        <label class="form-label" style="color:var(--color-gray-800);">참가 대상</label>
        <input type="text" id="cg-target" placeholder="예: 청년부 남성, 40대 부부" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
      </div>
      <div class="form-group">
        <label class="form-label" style="color:var(--color-gray-800);">소모임 소개</label>
        <textarea id="cg-desc" placeholder="모임의 방향성과 소개글을 작성해 주세요..." style="width:100%; height:80px; padding:10px; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px; resize:none; font-family:var(--font-main);"></textarea>
      </div>
      <button class="btn btn-primary" onclick="Mobile.saveNewGroup()">소모임 개설하기</button>
    `;
    this.showModal("새 소모임 개설", modalContent);
  },

  saveNewGroup() {
    const user = window.Auth.getCurrentUser();
    const title = document.getElementById("cg-title").value.trim();
    const category = document.getElementById("cg-category").value.trim();
    const capacity = parseInt(document.getElementById("cg-capacity").value);
    const leader_name = document.getElementById("cg-leader").value.trim();
    const day = document.getElementById("cg-day").value;
    const time = document.getElementById("cg-time").value.trim();
    const location = document.getElementById("cg-location").value.trim();
    const target = document.getElementById("cg-target").value.trim();
    const desc = document.getElementById("cg-desc").value.trim();

    if (!title || !category || !time || !location || !target || !desc) {
      alert("모든 입력란을 작성해 주세요.");
      return;
    }

    // Lookup or insert leader user
    let leader_id = user.id;
    if (leader_name) {
      const existingLeader = window.DB.query("users", u => u.name === leader_name)[0];
      if (existingLeader) {
        leader_id = existingLeader.id;
      } else {
        leader_id = "usr_" + Date.now();
        window.DB.insert("users", {
          id: leader_id,
          name: leader_name,
          phone: "010-0000-0000",
          email: leader_id + "@mokyang.org",
          password: "1111",
          role: "leader",
          approval_status: "approved",
          created_at: new Date().toISOString()
        });
      }
    }

    const newGroup = {
      title,
      category,
      description: desc,
      leader_id,
      day_of_week: day,
      time,
      location,
      target,
      capacity,
      is_active: true
    };

    const inserted = window.DB.insert("small_groups", newGroup);
    
    // Auto register leader as approved member
    window.DB.insert("small_group_members", {
      group_id: inserted.id,
      user_id: leader_id,
      status: "approved",
      joined_at: new Date().toISOString()
    });

    this.showToast("소모임이 성공적으로 개설되었습니다.");
    this.closeModal();
    this.render();
  },

  // 3. EDUCATION SCREEN (온라인 양육 플랫폼)
  renderEducationScreen(container) {
    const user = window.Auth.getCurrentUser();
    const courses = window.DB.query("courses", c => c.is_active);
    const canCreateCourse = user.role === "teacher" || user.role === "admin";

    let html = "";
    if (canCreateCourse) {
      html += `
        <button class="btn btn-gold" id="btn-create-course" style="margin-bottom:16px; padding:10px; min-height:40px; font-size:15px;">
          ➕ 새 양육 과정(강좌) 개설하기
        </button>
      `;
    }

    if (courses.length === 0) {
      html += `<div style="text-align:center; padding: 40px; color:var(--color-gray-600);">진행 중인 양육 과정이 없습니다.</div>`;
      container.innerHTML = html;

      const createCourseBtn = document.getElementById("btn-create-course");
      if (createCourseBtn) {
        createCourseBtn.addEventListener("click", () => this.openCreateCourseModal());
      }
      return;
    }

    courses.forEach(c => {
      const teacher = window.DB.query("users", u => u.id === c.teacher_id)[0] || { name: "미지정 교사" };
      const enrollment = window.DB.query("course_enrollments", e => e.course_id === c.id && e.user_id === user.id)[0];
      
      let btnLabel = "수강 신청하기";
      let btnClass = "btn-gold";
      let isEnrolled = false;
      let progressRate = 0;

      if (enrollment) {
        isEnrolled = true;
        progressRate = enrollment.progress_rate;
        if (progressRate >= 100) {
          btnLabel = "수강 완료 (강의 목록 보기)";
          btnClass = "btn-primary";
        } else {
          btnLabel = `학습 이어하기 (${progressRate}%)`;
          btnClass = "btn-primary";
        }
      }

      html += `
        <div class="m-card">
          <div class="m-card-title">${c.title}</div>
          <p style="font-size:var(--font-size-sm); color:var(--color-gray-600); line-height:1.5; margin-bottom:12px;">${c.description}</p>
          <div style="font-size:var(--font-size-sm); color:var(--color-gray-800); margin-bottom:12px; display:flex; justify-content:space-between;">
            <span>👨‍🏫 담당교사: <strong>${teacher.name}</strong></span>
            <span>📚 총 <strong>${c.total_lessons}</strong>강의</span>
          </div>
          
          ${isEnrolled ? `
            <div style="margin-bottom:12px;">
              <div class="progress-bar-container">
                <div class="progress-bar-fill gold" style="width: ${progressRate}%;"></div>
              </div>
            </div>
          ` : ""}

          <button class="btn ${btnClass}" onclick="Mobile.handleCourseAction('${c.id}', ${isEnrolled})">
            ${btnLabel}
          </button>
        </div>
      `;
    });

    container.innerHTML = html;

    const createCourseBtn = document.getElementById("btn-create-course");
    if (createCourseBtn) {
      createCourseBtn.addEventListener("click", () => this.openCreateCourseModal());
    }
  },

  handleCourseAction(courseId, isEnrolled) {
    const user = window.Auth.getCurrentUser();
    if (!isEnrolled) {
      // Enroll
      const newEnrollment = {
        course_id: courseId,
        user_id: user.id,
        status: "enrolled",
        progress_rate: 0,
        enrolled_at: new Date().toISOString()
      };
      window.DB.insert("course_enrollments", newEnrollment);
      this.showToast("양육 과정 수강이 신청되었습니다. 첫 강의를 시청해 보세요!");
      this.render();
      setTimeout(() => this.openCourseLessons(courseId), 300);
    } else {
      this.openCourseLessons(courseId);
    }
  },

  openCourseLessons(courseId) {
    this.selectedCourseId = courseId;
    const course = window.DB.query("courses", c => c.id === courseId)[0];
    if (!course) return;

    const user = window.Auth.getCurrentUser();
    const lessons = window.DB.query("lessons", l => l.course_id === courseId).sort((a,b) => a.order_number - b.order_number);

    let lessonsHtml = "";
    if (lessons.length === 0) {
      lessonsHtml = `<p style="text-align:center; font-size:14px; padding:20px; color:var(--color-gray-600);">아직 등록된 강의가 없습니다.</p>`;
    } else {
      lessons.forEach(l => {
        const isCompleted = window.DB.query("lesson_progress", p => p.lesson_id === l.id && p.user_id === user.id && p.is_completed).length > 0;
        const submission = window.DB.query("submissions", s => s.lesson_id === l.id && s.user_id === user.id)[0];
        
        lessonsHtml += `
          <div class="lesson-list-item">
            <div class="lesson-list-header" onclick="Mobile.toggleLessonAccordion('${l.id}')">
              <span class="lesson-list-title">${l.title}</span>
              <span class="lesson-status-badge ${isCompleted ? "completed" : "pending"}">
                ${isCompleted ? "수강 완료" : "학습 대기"}
              </span>
            </div>
            
            <div class="lesson-body" id="les-body-${l.id}">
              <!-- 강의 비디오 (유튜브 또는 파일 분기) -->
              <div class="video-container">
                ${l.video_type === "file" || l.video_url.startsWith("blob:") ? `
                  <video src="${l.video_url}" controls style="width:100%; height:100%; object-fit:contain;" onerror="this.src='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'"></video>
                ` : `
                  <iframe src="${Mobile.parseYouTubeUrl(l.video_url)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                `}
              </div>

              <!-- 강의 교안 -->
              <div class="lesson-text-block">
                <h4>📄 강의 요약 및 설명</h4>
                <p>${l.lesson_note}</p>
              </div>

              <!-- 성경 본문 -->
              <div class="lesson-text-block">
                <h4>📜 오늘의 성경 본문</h4>
                <p><strong>${l.bible_text}</strong></p>
              </div>

              <!-- 나눔 질문 -->
              <div class="lesson-text-block">
                <h4>💬 나눔 및 묵상 질문</h4>
                <p>${l.discussion_questions.replace(/\n/g, '<br>')}</p>
              </div>

              <!-- 과제 제출 영역 -->
              <div class="lesson-text-block">
                <h4>✏️ 강의 과제</h4>
                <p style="margin-bottom:8px; font-weight:700;">[과제]: ${l.assignment_text}</p>
                
                ${submission ? `
                  <div style="background:var(--color-navy-bg); padding:10px; border-radius:6px; margin-top:8px;">
                    <div style="font-size:12px; color:var(--color-gray-600);">제출일: ${submission.submitted_at.slice(0, 16).replace('T', ' ')}</div>
                    <div style="font-size:14px; font-weight:700; margin-top:4px;">제출 내용:</div>
                    <p style="font-size:13px; color:var(--color-gray-800);">${submission.content}</p>
                    
                    ${submission.feedback ? `
                      <div style="border-top:1px dashed var(--color-gold); margin-top:8px; padding-top:8px;">
                        <span style="font-size:12px; font-weight:700; color:var(--color-navy);">💬 담당 교사 피드백:</span>
                        <p style="font-size:13px; color:var(--color-gold-dark); font-style:italic;">"${submission.feedback}"</p>
                      </div>
                    ` : `<div style="font-size:11px; color:var(--color-gray-600); margin-top:6px;">교사의 피드백을 기다리는 중입니다.</div>`}
                  </div>
                ` : `
                  <textarea id="assign-input-${l.id}" placeholder="과제 답안을 여기에 작성하세요..." style="width:100%; height:80px; padding:8px; border:1px solid var(--color-gray-300); border-radius:6px; font-size:13px; resize:none; font-family:var(--font-main); outline:none;"></textarea>
                  <button class="btn btn-gold" onclick="Mobile.submitAssignment('${l.id}')" style="margin-top:6px; padding:6px; min-height:36px; font-size:13px;">과제 제출하기</button>
                `}
              </div>

              <!-- 완료하기 버튼 -->
              ${!isCompleted ? `
                <button class="btn btn-primary" onclick="Mobile.completeLesson('${l.id}', '${courseId}')" style="margin-top:12px;">
                  ✔️ 강의 완료 체크하기
                </button>
              ` : `
                <div style="text-align:center; color:var(--color-success); font-weight:700; font-size:15px; margin-top:12px;">
                  🎉 이 강의를 완료했습니다!
                </div>
              `}
            </div>
          </div>
        `;
      });
    }

    // Teacher/Admin can register a lesson
    const isTeacher = user.role === "teacher" || user.role === "admin";
    const regLessonBtnHtml = isTeacher ? `
      <button class="btn btn-outline-gold" onclick="Mobile.openAddLessonModal('${courseId}')" style="margin-bottom:15px; padding:10px; min-height:40px; font-size:14px;">
        ➕ 새 강의 등록하기
      </button>
    ` : "";

    const modalContent = `
      <div style="font-size:var(--font-size-sm); font-weight:500; color:var(--color-gold-dark); margin-bottom:4px;">교육 과정 상세</div>
      <h3 style="font-size:var(--font-size-md); font-weight:700; color:var(--color-navy); margin-bottom:16px;">${course.title}</h3>
      
      ${regLessonBtnHtml}
      
      <div class="lesson-accordion-container">
        ${lessonsHtml}
      </div>
    `;

    this.showModal("강의 리스트", modalContent);
  },

  toggleLessonAccordion(lessonId) {
    const body = document.getElementById(`les-body-${lessonId}`);
    if (body) {
      const isVisible = body.style.display === "block";
      document.querySelectorAll(".lesson-body").forEach(el => el.style.display = "none");
      body.style.display = isVisible ? "none" : "block";
    }
  },

  submitAssignment(lessonId) {
    const user = window.Auth.getCurrentUser();
    const content = document.getElementById(`assign-input-${lessonId}`).value;

    if (!content.trim()) {
      alert("과제 내용을 적어주세요.");
      return;
    }

    const newSubmission = {
      lesson_id: lessonId,
      user_id: user.id,
      content: content,
      file_url: "",
      feedback: "",
      submitted_at: new Date().toISOString()
    };

    window.DB.insert("submissions", newSubmission);
    
    // Notify Teacher
    const lesson = window.DB.query("lessons", l => l.id === lessonId)[0];
    if (lesson) {
      const course = window.DB.query("courses", c => c.id === lesson.course_id)[0];
      if (course) {
        window.DB.insert("notifications", {
          user_id: course.teacher_id,
          title: "새 과제 제출",
          message: `[${course.title}] ${lesson.title} 과제를 ${user.name} 성도가 제출했습니다.`,
          is_read: false
        });
      }
    }

    this.showToast("과제가 제출되었습니다.");
    // Re-open course lessons list
    const courseId = this.selectedCourseId;
    this.closeModal();
    setTimeout(() => this.openCourseLessons(courseId), 100);
  },

  completeLesson(lessonId, courseId) {
    const user = window.Auth.getCurrentUser();

    // Check if progress already exists
    const progress = {
      lesson_id: lessonId,
      user_id: user.id,
      is_completed: true,
      completed_at: new Date().toISOString()
    };
    window.DB.insert("lesson_progress", progress);

    // Re-calculate course progress rate
    const lessons = window.DB.query("lessons", l => l.course_id === courseId);
    const completed = window.DB.query("lesson_progress", p => p.user_id === user.id && p.is_completed && lessons.some(l => l.id === p.lesson_id));
    
    const rate = Math.round((completed.length / lessons.length) * 100);
    
    const enrollment = window.DB.query("course_enrollments", e => e.course_id === courseId && e.user_id === user.id)[0];
    if (enrollment) {
      window.DB.update("course_enrollments", enrollment.id, {
        progress_rate: rate,
        status: rate >= 100 ? "completed" : "enrolled"
      });
    }

    this.showToast(`축하합니다! 강의 수강이 완료되었습니다. (진도율: ${rate}%)`);
    this.closeModal();
    setTimeout(() => this.openCourseLessons(courseId), 100);
  },

  openCreateCourseModal() {
    const modalContent = `
      <div class="form-group">
        <label class="form-label" style="color:var(--color-gray-800);">양육 과정명 (강좌명)</label>
        <input type="text" id="cc-title" placeholder="예: 제자훈련, QT 훈련반" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
      </div>
      <div class="form-group">
        <label class="form-label" style="color:var(--color-gray-800);">담당 교사</label>
        <input type="text" id="cc-teacher" placeholder="예: 이교사 (미입력 시 본인)" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
      </div>
      <div class="form-group">
        <label class="form-label" style="color:var(--color-gray-800);">과정 소개</label>
        <textarea id="cc-desc" placeholder="교육과정 상세 목표와 진행방식을 설명하세요..." style="width:100%; height:100px; padding:10px; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px; resize:none; font-family:var(--font-main);"></textarea>
      </div>
      <button class="btn btn-primary" onclick="Mobile.saveNewCourse()">과정 개설하기</button>
    `;
    this.showModal("새 양육 과정 개설", modalContent);
  },

  saveNewCourse() {
    const user = window.Auth.getCurrentUser();
    const title = document.getElementById("cc-title").value.trim();
    const teacher_name = document.getElementById("cc-teacher").value.trim();
    const desc = document.getElementById("cc-desc").value.trim();

    if (!title || !desc) {
      alert("과정명과 소개글을 작성해 주세요.");
      return;
    }

    // Lookup or insert teacher user
    let teacher_id = user.id;
    if (teacher_name) {
      const existingTeacher = window.DB.query("users", u => u.name === teacher_name)[0];
      if (existingTeacher) {
        teacher_id = existingTeacher.id;
      } else {
        teacher_id = "usr_" + Date.now();
        window.DB.insert("users", {
          id: teacher_id,
          name: teacher_name,
          phone: "010-0000-0000",
          email: teacher_id + "@mokyang.org",
          password: "1111",
          role: "teacher",
          approval_status: "approved",
          created_at: new Date().toISOString()
        });
      }
    }

    const newCourse = {
      title,
      description: desc,
      teacher_id,
      total_lessons: 0,
      is_active: true
    };

    window.DB.insert("courses", newCourse);
    this.showToast("양육 과정이 개설되었습니다. 이제 세부 강의를 추가해 보세요!");
    this.closeModal();
    this.render();
  },

  openAddLessonModal(courseId) {
    const course = window.DB.query("courses", c => c.id === courseId)[0] || { title: "" };
    const modalContent = `
      <div class="form-group">
        <label class="form-label" style="color:var(--color-gray-800);">대상 양육 과정</label>
        <input type="text" id="cl-course-select" placeholder="예: 새가족반, 제자훈련" value="${course.title}" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
      </div>
      <div class="form-group">
        <label class="form-label" style="color:var(--color-gray-800);">강의 제목</label>
        <input type="text" id="cl-title" placeholder="예: 1강. 하나님과의 동행" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
      </div>
      <div class="form-group">
        <label class="form-label" style="color:var(--color-gray-800);">동영상 등록 방식</label>
        <div style="display:flex; gap:20px; margin-bottom:10px; font-size:14px; color:var(--color-navy);">
          <label style="cursor:pointer;"><input type="radio" name="cl-video-src" value="youtube" checked onchange="Mobile.toggleVideoSource(this.value)"> 🔴 유튜브 링크</label>
          <label style="cursor:pointer;"><input type="radio" name="cl-video-src" value="file" onchange="Mobile.toggleVideoSource(this.value)"> 📁 파일 직접 올리기</label>
        </div>
      </div>
      <div class="form-group" id="cl-video-url-group">
        <label class="form-label" style="color:var(--color-gray-800);">강의 영상 유튜브 링크</label>
        <input type="text" id="cl-video" placeholder="예: https://www.youtube.com/watch?v=n4fCqC96dY0" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
      </div>
      <div class="form-group" id="cl-video-file-group" style="display:none;">
        <label class="form-label" style="color:var(--color-gray-800);">동영상 파일 선택 (.mp4, .mov 등)</label>
        <input type="file" id="cl-video-file" accept="video/*" style="padding:8px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
        <span style="font-size:11px; color:var(--color-gray-600); display:block; margin-top:4px;">* 로컬 동영상 파일을 가상으로 업로드합니다. (새로고침 전까지 실제 재생 가능)</span>
      </div>
      <div class="form-group">
        <label class="form-label" style="color:var(--color-gray-800);">강의 요약 및 교안</label>
        <textarea id="cl-note" placeholder="강의 핵심 교안을 적어주세요..." style="width:100%; height:80px; padding:10px; border:1px solid var(--color-gray-300); border-radius:6px; font-size:13px; resize:none; font-family:var(--font-main);"></textarea>
      </div>
      <div class="form-group-row">
        <div class="form-group">
          <label class="form-label" style="color:var(--color-gray-800);">성경 본문</label>
          <input type="text" id="cl-bible" placeholder="예: 에베소서 1:1-3" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
        </div>
        <div class="form-group">
          <label class="form-label" style="color:var(--color-gray-800);">강의 순서 (번호)</label>
          <input type="number" id="cl-order" value="1" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" style="color:var(--color-gray-800);">나눔 질문</label>
        <textarea id="cl-question" placeholder="조원들과 나눌 질문을 적어주세요..." style="width:100%; height:50px; padding:10px; border:1px solid var(--color-gray-300); border-radius:6px; font-size:13px; resize:none; font-family:var(--font-main);"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label" style="color:var(--color-gray-800);">과제 내용</label>
        <input type="text" id="cl-assign" placeholder="예: 에베소서 1장 1-3절 필사하기" style="padding:10px; width:100%; border:1px solid var(--color-gray-300); border-radius:6px; font-size:14px;">
      </div>
      <button class="btn btn-primary" onclick="Mobile.saveNewLesson()">강의 등록하기</button>
    `;
    this.showModal("과정에 새 강의 등록", modalContent);
  },

  saveNewLesson(courseId) {
    const typedCourse = document.getElementById("cl-course-select").value.trim();
    if (!typedCourse) {
      alert("대상 양육 과정을 입력해 주세요.");
      return;
    }

    let targetCourseId = courseId;
    const existingCourse = window.DB.query("courses", c => c.title === typedCourse)[0];
    if (existingCourse) {
      targetCourseId = existingCourse.id;
    } else {
      targetCourseId = "crs_" + Date.now();
      window.DB.insert("courses", {
        id: targetCourseId,
        title: typedCourse,
        description: typedCourse + " 과정 설명",
        teacher_id: "usr_teacher",
        total_lessons: 0,
        is_active: true,
        created_at: new Date().toISOString()
      });
    }

    const title = document.getElementById("cl-title").value.trim();
    const note = document.getElementById("cl-note").value.trim();
    const bible = document.getElementById("cl-bible").value.trim();
    const order = parseInt(document.getElementById("cl-order").value);
    const question = document.getElementById("cl-question").value.trim();
    const assign = document.getElementById("cl-assign").value.trim();

    const videoSrc = document.querySelector('input[name="cl-video-src"]:checked').value;
    let video = "";
    let videoType = "youtube";

    if (videoSrc === "youtube") {
      video = document.getElementById("cl-video").value;
      if (!video) {
        alert("유튜브 동영상 링크를 입력해 주세요.");
        return;
      }
      video = Mobile.parseYouTubeUrl(video);
    } else {
      const fileInput = document.getElementById("cl-video-file");
      if (fileInput && fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        video = URL.createObjectURL(file); // create temporary blob url
        videoType = "file";
        
        // Save mapping
        window.MokyangVideoBlobMap = window.MokyangVideoBlobMap || {};
        window.MokyangVideoBlobMap[file.name] = video;
      } else {
        alert("로컬 동영상 파일을 선택해 주세요.");
        return;
      }
    }

    if (!title || !note || !bible || !question || !assign) {
      alert("모든 빈칸을 성실히 적어주세요.");
      return;
    }

    const newLesson = {
      course_id: targetCourseId,
      title,
      video_url: video,
      video_type: videoType,
      lesson_note: note,
      summary: title + " 요약",
      bible_text: bible,
      discussion_questions: question,
      assignment_text: assign,
      order_number: order
    };

    window.DB.insert("lessons", newLesson);

    // Update course total count
    const course = window.DB.query("courses", c => c.id === targetCourseId)[0];
    if (course) {
      window.DB.update("courses", targetCourseId, { total_lessons: (course.total_lessons || 0) + 1 });
    }

    this.showToast("새 강의가 성공적으로 등록되었습니다.");
    this.closeModal();
    setTimeout(() => this.openCourseLessons(targetCourseId), 100);
  },

  toggleVideoSource(value) {
    const urlGroup = document.getElementById("cl-video-url-group");
    const fileGroup = document.getElementById("cl-video-file-group");
    if (value === "youtube") {
      if (urlGroup) urlGroup.style.display = "block";
      if (fileGroup) fileGroup.style.display = "none";
    } else {
      if (urlGroup) urlGroup.style.display = "none";
      if (fileGroup) fileGroup.style.display = "block";
    }
  },

  parseYouTubeUrl(url) {
    if (!url) return "";
    url = url.trim();
    
    // Regular expression to extract 11-digit YouTube video ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    let videoId = "";
    
    if (match && match[2].length === 11) {
      videoId = match[2];
    } else if (url.length === 11 && !url.includes("/") && !url.includes(".")) {
      videoId = url;
    }
    
    if (videoId) {
      const origin = window.location.origin;
      return `https://www.youtube-nocookie.com/embed/${videoId}?origin=${encodeURIComponent(origin)}`;
    }
    
    return url;
  },

  // 4. SERMON SCREEN
  renderSermonScreen(container) {
    const sermons = window.DB.get("sermon_videos");
    // Sort by newest date
    sermons.sort((a,b) => new Date(b.sermon_date) - new Date(a.sermon_date));

    let html = "";
    sermons.forEach(s => {
      html += `
        <div class="m-card">
          <div style="font-size:13px; font-weight:700; color:var(--color-gold-dark); margin-bottom:4px;">주일 설교 (${s.sermon_date})</div>
          <div class="m-card-title">${s.title}</div>
          <div style="font-size:14px; color:var(--color-gray-600); margin-bottom:12px;">본문: <strong>${s.bible_text}</strong> | 설교: ${s.preacher}</div>
          
          <div class="video-container" style="margin-bottom:12px;">
            <iframe src="${Mobile.parseYouTubeUrl(s.youtube_url)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
          </div>

          <!-- 아코디언 상세 -->
          <div class="lesson-text-block">
            <h4 style="cursor:pointer;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">📖 설교 요약 (보기/접기)</h4>
            <p style="margin-top:6px; display:none;">${s.summary}</p>
          </div>

          <div class="lesson-text-block">
            <h4 style="cursor:pointer;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">💬 금주 묵상 및 적용 질문 (보기/접기)</h4>
            <p style="margin-top:6px; display:none; white-space:pre-line;">${s.application_questions}</p>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  // 5. MY PROFILE SCREEN
  renderMyInfoScreen(container) {
    const user = window.Auth.getCurrentUser();
    if (!user) return;

    let roleName = "일반 성도";
    if (user.role === "admin") roleName = "담임목사 (관리자)";
    else if (user.role === "leader") roleName = "목장 리더 (소모임 리더)";
    else if (user.role === "teacher") roleName = "양육 담당 교사";

    // My small groups applications status
    const groupApplications = window.DB.query("small_group_members", m => m.user_id === user.id);
    let myGroupAppsHtml = "";
    if (groupApplications.length === 0) {
      myGroupAppsHtml = `<p style="font-size:14px; color:var(--color-gray-600);">신청한 소모임 내역이 없습니다.</p>`;
    } else {
      groupApplications.forEach(app => {
        const group = window.DB.query("small_groups", g => g.id === app.group_id)[0];
        if (group) {
          const statusText = app.status === "approved" ? "✅ 승인 완료" : (app.status === "pending" ? "⏳ 승인 대기중" : "❌ 가입 반려");
          myGroupAppsHtml += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--color-gray-100); font-size:14px;">
              <span>[${group.category}] ${group.title}</span>
              <strong>${statusText}</strong>
            </div>
          `;
        }
      });
    }

    // My assignment submissions
    const mySubmissions = window.DB.query("submissions", s => s.user_id === user.id);
    let mySubsHtml = "";
    if (mySubmissions.length === 0) {
      mySubsHtml = `<p style="font-size:14px; color:var(--color-gray-600);">제출한 과제가 없습니다.</p>`;
    } else {
      mySubmissions.forEach(sub => {
        const lesson = window.DB.query("lessons", l => l.id === sub.lesson_id)[0];
        if (lesson) {
          const feedbackText = sub.feedback ? `💬 피드백 도착: "${sub.feedback.substring(0, 15)}..."` : "⏳ 피드백 대기중";
          mySubsHtml += `
            <div style="padding:8px 0; border-bottom:1px solid var(--color-gray-100); font-size:14px;">
              <div style="display:flex; justify-content:space-between;">
                <strong>${lesson.title.substring(0, 18)}...</strong>
                <span style="font-size:12px; color:var(--color-gray-600);">${sub.submitted_at.slice(0, 10)}</span>
              </div>
              <div style="font-size:12px; color:var(--color-gold-dark); margin-top:2px;">${feedbackText}</div>
            </div>
          `;
        }
      });
    }

    container.innerHTML = `
      <div class="m-card" style="background: linear-gradient(135deg, var(--color-navy-light) 0%, var(--color-navy) 100%); color:white;">
        <div style="display:flex; align-items:center; gap:16px;">
          <div style="width:60px; height:60px; border-radius:50%; background:var(--color-gold); color:var(--color-navy); display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:700;">
            ${user.name.substring(0, 1)}
          </div>
          <div>
            <h3 style="font-size:var(--font-size-md); font-weight:700;">${user.name} 성도님</h3>
            <span class="group-tag" style="background:var(--color-gold-light); margin-top:4px; display:inline-block;">${roleName}</span>
          </div>
        </div>
        <div style="margin-top:16px; font-size:14px; border-top:1px solid rgba(255,255,255,0.1); padding-top:12px; color:var(--color-gold-light);">
          <div>📱 연락처: ${user.phone}</div>
          <div>📧 이메일: ${user.email}</div>
        </div>
      </div>

      <div class="m-card">
        <div class="m-card-title">📝 소모임 가입/신청 현황</div>
        ${myGroupAppsHtml}
      </div>

      <div class="m-card">
        <div class="m-card-title">📚 내 양육 과제 현황</div>
        ${mySubsHtml}
      </div>

      <button class="btn btn-secondary" id="btn-logout" style="margin-top: 10px; color: var(--color-danger); border:1px solid var(--color-gray-300);">
        🚪 로그아웃 하기
      </button>
    `;

    document.getElementById("btn-logout").addEventListener("click", () => {
      window.Auth.logout();
      window.App.checkSession();
    });
  },

  // 6. DEVOTION INPUT / RESPONSE MODAL
  openDevotionModal(devotionId) {
    const user = window.Auth.getCurrentUser();
    const dev = window.DB.query("devotions", d => d.id === devotionId)[0];
    if (!dev) return;

    // Get previous response if exists
    const response = window.DB.query("devotion_responses", r => r.devotion_id === dev.id && r.user_id === user.id)[0] || {
      grace_note: "",
      application_note: "",
      prayer_request: "",
      visibility: "share"
    };

    const modalContent = `
      <div style="font-size:14px; font-weight:700; color:var(--color-gold-dark); margin-bottom:4px;">매일 말씀 묵상지</div>
      <h3 style="font-size:var(--font-size-md); font-weight:700; color:var(--color-navy); margin-bottom:12px;">${dev.title}</h3>
      
      <!-- 성경본문 상세 -->
      <div class="lesson-text-block" style="max-height:160px; overflow-y:auto; background:#fff;">
        <h4 style="font-size:13px;">📜 성경 본문 [${dev.bible_text}]</h4>
        <p style="white-space:pre-line; font-size:13px; margin-top:6px;">${dev.scripture}</p>
      </div>

      <!-- 말씀 해설 -->
      <div class="lesson-text-block" style="max-height:120px; overflow-y:auto; background:#fff;">
        <h4 style="font-size:13px;">💡 말씀 해설</h4>
        <p style="font-size:13px; margin-top:4px;">${dev.explanation}</p>
      </div>

      <!-- 성도 묵상 작성란 -->
      <div class="devotion-form">
        <div class="form-group" style="margin-bottom:12px;">
          <label style="font-size:14px; font-weight:700; color:var(--color-navy);">1. 오늘 말씀 속에서 나에게 주신 하나님의 은혜는?</label>
          <textarea id="dev-grace" placeholder="오늘 묵상 중 마음에 와닿은 구절과 깨달은 은혜를 적어 주세요...">${response.grace_note}</textarea>
        </div>
        <div class="form-group" style="margin-bottom:12px;">
          <label style="font-size:14px; font-weight:700; color:var(--color-navy);">2. 내 삶에 구체적으로 어떻게 적용하시겠습니까?</label>
          <textarea id="dev-app" placeholder="오늘 만나는 지체와의 관계, 일상의 태도 등 구체적인 삶의 행동지침을 써 보세요...">${response.application_note}</textarea>
        </div>
        <div class="form-group" style="margin-bottom:12px;">
          <label style="font-size:14px; font-weight:700; color:var(--color-navy);">3. 오늘 하루 붙들고 기도할 기도제목</label>
          <textarea id="dev-prayer" placeholder="주님께 털어놓을 나의 기도 고백을 한두 줄로 요약해 적어 보세요...">${response.prayer_request}</textarea>
        </div>
        
        <div class="form-group">
          <label style="font-size:14px; font-weight:700; color:var(--color-navy);">🔓 묵상글 공개 설정</label>
          <div class="visibility-options">
            <button class="vis-btn ${response.visibility === "private" ? "active" : ""}" data-vis="private" onclick="Mobile.setDevVisibility(event)">🔒 나만보기</button>
            <button class="vis-btn ${response.visibility === "leader" ? "active" : ""}" data-vis="leader" onclick="Mobile.setDevVisibility(event)">👥 리더만</button>
            <button class="vis-btn ${response.visibility === "share" ? "active" : ""}" data-vis="share" onclick="Mobile.setDevVisibility(event)">🌍 소모임과 나눔</button>
          </div>
          <input type="hidden" id="dev-vis-value" value="${response.visibility}">
        </div>
      </div>

      <button class="btn btn-primary" onclick="Mobile.saveDevotionResponse('${dev.id}', '${response.id || ""}')">
        묵상지 제출하기
      </button>
    `;

    this.showModal("오늘의 말씀 묵상", modalContent);
  },

  setDevVisibility(e) {
    const vis = e.currentTarget.dataset.vis;
    document.querySelectorAll(".vis-btn").forEach(btn => btn.classList.remove("active"));
    e.currentTarget.classList.add("active");
    document.getElementById("dev-vis-value").value = vis;
  },

  saveDevotionResponse(devotionId, existingResponseId) {
    const user = window.Auth.getCurrentUser();
    const grace = document.getElementById("dev-grace").value;
    const app = document.getElementById("dev-app").value;
    const prayer = document.getElementById("dev-prayer").value;
    const visibility = document.getElementById("dev-vis-value").value;

    if (!grace || !app || !prayer) {
      alert("모든 묵상 작성 필드를 입력해 주세요.");
      return;
    }

    const payload = {
      devotion_id: devotionId,
      user_id: user.id,
      grace_note: grace,
      application_note: app,
      prayer_request: prayer,
      visibility: visibility
    };

    if (existingResponseId) {
      window.DB.update("devotion_responses", existingResponseId, payload);
      this.showToast("묵상 기록이 수정되었습니다.");
    } else {
      window.DB.insert("devotion_responses", payload);
      this.showToast("오늘의 묵상이 등록되었습니다. 오늘도 빛 가운데 동행하세요!");
    }

    this.closeModal();
    this.render();
  },

  // 7. CALENDAR MODAL
  showCalendarModal() {
    const schedules = window.DB.query("church_schedules", s => s.date.startsWith("2026-06"));
    const eventDays = schedules.map(s => parseInt(s.date.split("-")[2]));

    const modalContent = `
      <div class="calendar-widget">
        <div class="calendar-header">
          <strong style="color:var(--color-navy);">2026년 6월</strong>
          <span style="font-size:12px; color:var(--color-gray-600);">* 빨간 점은 일정이 있는 날</span>
        </div>
        <div class="calendar-grid">
          <!-- 요일 라벨 -->
          <div class="calendar-day-label" style="color:var(--color-danger);">일</div>
          <div class="calendar-day-label">월</div>
          <div class="calendar-day-label">화</div>
          <div class="calendar-day-label">수</div>
          <div class="calendar-day-label">목</div>
          <div class="calendar-day-label">금</div>
          <div class="calendar-day-label" style="color:var(--color-navy-light);">토</div>

          <!-- 6월 1일부터 30일까지 그리기 (2026년 6월 1일은 월요일) -->
          <!-- 공백 (일요일 채우기) -->
          <div class="calendar-day" style="visibility:hidden;"></div>
          
          ${Array.from({ length: 30 }, (_, i) => {
            const dayNum = i + 1;
            const hasEvent = eventDays.includes(dayNum);
            const isToday = dayNum === 24;
            const isActive = dayNum === 24; // Default selection

            return `
              <div class="calendar-day ${isToday ? "today" : ""} ${isActive ? "active-day" : ""}" 
                onclick="Mobile.selectCalendarDay(event, ${dayNum})" data-day="${dayNum}">
                <span>${dayNum}</span>
                ${hasEvent ? `<div class="day-event-dot"></div>` : ""}
              </div>
            `;
          }).join("")}
        </div>

        <div class="event-list" id="calendar-event-details">
          <!-- Events list will load dynamically -->
        </div>
      </div>
    `;

    this.showModal("교회 행사 및 모임 일정", modalContent);
    this.selectCalendarDay(null, 24); // Default to today (24th)
  },

  selectCalendarDay(e, day) {
    if (e) {
      document.querySelectorAll(".calendar-day").forEach(el => el.classList.remove("active-day"));
      e.currentTarget.classList.add("active-day");
    }

    const eventDetailsDiv = document.getElementById("calendar-event-details");
    if (!eventDetailsDiv) return;

    const dateStr = `2026-06-${String(day).padStart(2, '0')}`;
    const dayEvents = window.DB.query("church_schedules", s => s.date === dateStr);
    
    dayEvents.sort((a, b) => a.time.localeCompare(b.time));

    if (dayEvents.length === 0) {
      eventDetailsDiv.innerHTML = `<p style="text-align:center; font-size:14px; color:var(--color-gray-600); padding-top:10px;">이 날은 등록된 일정이 없습니다.</p>`;
      return;
    }

    const typeLabels = {
      worship: "예배",
      group: "소모임",
      education: "양육",
      prayer: "기도회",
      festival: "행사"
    };

    let html = `<h4>📅 6월 ${day}일 모임/일정</h4>`;
    dayEvents.forEach(ev => {
      html += `
        <div class="event-item">
          <div class="event-time">${ev.time}</div>
          <div class="event-info">
            <div class="event-title">${ev.title}</div>
            <div class="event-desc">${ev.description}</div>
          </div>
          <span class="event-type ${ev.type}">
            ${typeLabels[ev.type] || ev.type}
          </span>
        </div>
      `;
    });
    eventDetailsDiv.innerHTML = html;
  },

  // 8. NOTIFICATION MODAL
  showNotificationsModal() {
    const user = window.Auth.getCurrentUser();
    const notis = window.DB.query("notifications", n => n.user_id === user.id);

    // Sort by newest
    notis.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    let html = "";
    if (notis.length === 0) {
      html = `<p style="text-align:center; padding:30px; font-size:14px; color:var(--color-gray-600);">최근 알림이 없습니다.</p>`;
    } else {
      notis.forEach(n => {
        html += `
          <div class="notification-item ${n.is_read ? "" : "unread"}">
            <i class="fas fa-bell notification-icon"></i>
            <div class="notification-text">
              <div class="notification-title">${n.title}</div>
              <div class="notification-desc">${n.message}</div>
              <div class="notification-time">${n.created_at.slice(0, 16).replace('T', ' ')}</div>
            </div>
          </div>
        `;
        // Mark as read
        if (!n.is_read) {
          window.DB.update("notifications", n.id, { is_read: true });
        }
      });
    }

    this.showModal("알림 내역", html);
    this.updateNotificationBadge();
  },

  showNoticeDetail(noticeId) {
    const n = window.DB.query("notices", item => item.id === noticeId)[0];
    if (!n) return;

    const modalContent = `
      <div style="font-size:13px; color:var(--color-gold-dark); font-weight:700; margin-bottom:4px;">교회 공지사항</div>
      <h3 style="font-size:var(--font-size-md); font-weight:700; color:var(--color-navy); margin-bottom:12px;">${n.title}</h3>
      <div style="font-size:12px; color:var(--color-gray-600); margin-bottom:16px;">작성일: ${n.created_at.slice(0,10)}</div>
      <div style="font-size:15px; line-height:1.6; color:var(--color-gray-800); white-space:pre-wrap; background:var(--color-gray-100); padding:16px; border-radius:8px;">${n.content}</div>
    `;
    this.showModal("공지사항", modalContent);
  },

  // 9. MODAL & TOAST HELPERS
  showModal(title, content) {
    const modal = document.getElementById("mobile-modal");
    const modalTitle = document.getElementById("mobile-modal-title");
    const modalBody = document.getElementById("mobile-modal-body");

    if (modal && modalTitle && modalBody) {
      modalTitle.innerText = title;
      modalBody.innerHTML = content;
      modal.style.display = "flex";
    }
  },

  closeModal() {
    const modal = document.getElementById("mobile-modal");
    if (modal) {
      modal.style.display = "none";
    }
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

window.Mobile = Mobile;
