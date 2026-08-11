// 用户认证与进度持久化模块
// 使用 localStorage 实现多账户隔离

const USERS_KEY = 'beisen_users';
const SESSION_KEY = 'beisen_current_user';

// 简单哈希函数（用于密码）
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// 获取所有用户
function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// 保存用户列表
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// 获取当前登录用户
export function getCurrentUser() {
  return localStorage.getItem(SESSION_KEY) || null;
}

// 设置当前用户
function setCurrentUser(username) {
  localStorage.setItem(SESSION_KEY, username);
}

// 清除当前用户
function clearCurrentUser() {
  localStorage.removeItem(SESSION_KEY);
}

// 注册新用户
export function registerUser(username, password) {
  if (!username || !password) {
    return { success: false, message: '用户名和密码不能为空' };
  }
  if (username.length < 2 || username.length > 20) {
    return { success: false, message: '用户名长度应为 2-20 个字符' };
  }
  if (password.length < 4) {
    return { success: false, message: '密码长度至少 4 位' };
  }

  const users = getUsers();
  if (users[username]) {
    return { success: false, message: '该用户名已被注册' };
  }

  users[username] = {
    passwordHash: simpleHash(password),
    createdAt: Date.now(),
  };
  saveUsers(users);

  // 初始化该用户的进度数据
  initUserProgress(username);

  return { success: true, message: '注册成功' };
}

// 登录
export function loginUser(username, password) {
  const users = getUsers();
  const user = users[username];

  if (!user) {
    return { success: false, message: '用户不存在' };
  }
  if (user.passwordHash !== simpleHash(password)) {
    return { success: false, message: '密码错误' };
  }

  setCurrentUser(username);
  return { success: true, message: '登录成功' };
}

// 登出
export function logoutUser() {
  clearCurrentUser();
  return { success: true };
}

// 初始化用户进度
function initUserProgress(username) {
  const key = `beisen_progress_${username}`;
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify({
      answered: {},
      bookmarks: [],
      wrongs: [],
      stats: {
        totalAnswered: 0,
        totalCorrect: 0,
        lastPractice: null,
      },
    }));
  }
}

// 获取用户进度
export function getUserProgress(username) {
  const key = `beisen_progress_${username}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      initUserProgress(username);
      return getUserProgress(username);
    }
    return JSON.parse(raw);
  } catch {
    initUserProgress(username);
    return getUserProgress(username);
  }
}

// 保存用户进度
export function saveUserProgress(username, progress) {
  const key = `beisen_progress_${username}`;
  localStorage.setItem(key, JSON.stringify(progress));
}

// 获取用户统计数据
export function getUserStats(username) {
  const progress = getUserProgress(username);
  const answered = progress.answered || {};
  const bookmarks = progress.bookmarks || [];
  const wrongs = progress.wrongs || [];

  const totalAnswered = Object.keys(answered).length;
  // 需要题目数据来计算正确率，这里先返回基础统计
  return {
    totalAnswered,
    bookmarksCount: bookmarks.length,
    wrongsCount: wrongs.length,
  };
}

// 删除用户
export function deleteUser(username) {
  const users = getUsers();
  delete users[username];
  saveUsers(users);
  localStorage.removeItem(`beisen_progress_${username}`);
  clearCurrentUser();
}

// 检查是否已登录
export function isLoggedIn() {
  return !!getCurrentUser();
}
