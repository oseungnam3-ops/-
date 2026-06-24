/**
 * MokyangOn Authentication Engine
 */

const Auth = {
  getCurrentUser() {
    const sessionUser = sessionStorage.getItem("mokyang_session");
    if (!sessionUser) return null;
    
    // Always get the freshest data from DB to reflect role or status changes
    const userObj = JSON.parse(sessionUser);
    const dbUser = window.DB.query("users", u => u.id === userObj.id)[0];
    if (dbUser) {
      sessionStorage.setItem("mokyang_session", JSON.stringify(dbUser));
      return dbUser;
    }
    return null;
  },

  login(email, password) {
    const users = window.DB.get("users");
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return { success: false, message: "이메일 또는 비밀번호가 일치하지 않습니다." };
    }

    if (user.approval_status === "rejected") {
      return { success: false, message: "가입 신청이 거절되었습니다. 교회 사무실에 문의해 주세요." };
    }

    // Update last login
    window.DB.update("users", user.id, { last_login_at: new Date().toISOString() });
    
    // Save to session
    const freshUser = window.DB.query("users", u => u.id === user.id)[0];
    sessionStorage.setItem("mokyang_session", JSON.stringify(freshUser));
    
    if (freshUser.role === "admin") {
      sessionStorage.setItem("mokyang_original_admin", "true");
    } else {
      sessionStorage.removeItem("mokyang_original_admin");
    }
    
    return { success: true, user: freshUser };
  },

  register(name, phone, email, password) {
    const users = window.DB.get("users");
    const existing = users.find(u => u.email === email);
    
    if (existing) {
      return { success: false, message: "이미 가입된 이메일 주소입니다." };
    }

    const newUser = {
      name,
      phone,
      email,
      password,
      role: "member", // Default role
      approval_status: "pending", // Default status is pending
      last_login_at: ""
    };

    const inserted = window.DB.insert("users", newUser);
    return { success: true, user: inserted };
  },

  logout() {
    sessionStorage.removeItem("mokyang_session");
    sessionStorage.removeItem("mokyang_original_admin");
  },

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  isApproved() {
    const user = this.getCurrentUser();
    return user && user.approval_status === "approved";
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === "admin" && user.approval_status === "approved";
  },

  // Developer simulation helper to force login as any user
  simulateRoleLogin(role) {
    const users = window.DB.get("users");
    let targetUser = users.find(u => u.role === role && u.approval_status === "approved");
    
    // Special handling for normal member or pending user
    if (role === "pending") {
      targetUser = users.find(u => u.approval_status === "pending");
    } else if (role === "member") {
      targetUser = users.find(u => u.role === "member" && u.approval_status === "approved");
    }

    if (targetUser) {
      sessionStorage.setItem("mokyang_session", JSON.stringify(targetUser));
      if (role === "admin") {
        sessionStorage.setItem("mokyang_original_admin", "true");
      }
      return targetUser;
    }
    return null;
  }
};

window.Auth = Auth;
