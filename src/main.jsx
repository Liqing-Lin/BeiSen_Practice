import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, ArrowRight, BarChart3, Bookmark, BrainCircuit,
  Check, ChevronRight, Eye, FileBarChart, Flame,
  Grid2X2, Home, Lightbulb, LogIn, LogOut, RotateCcw, Star, Target, Trophy, User, X,
} from 'lucide-react';
import './styles.css';
import { questionSets } from './data/questions';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  getUserProgress,
  saveUserProgress,
} from './data/auth';

const INITIAL_STATE = {
  activeSetId: null,
  index: 0,
  selected: null,
  answered: {},
  bookmarks: [],
  wrongs: [],
  mode: 'sequential',
};

// Load progress for specific user
function loadUserProgress(username) {
  const progress = getUserProgress(username);
  return {
    answered: progress.answered || {},
    bookmarks: progress.bookmarks || [],
    wrongs: progress.wrongs || [],
  };
}

// Save progress for specific user
function persistUserProgress(username, state) {
  const progress = getUserProgress(username);
  progress.answered = state.answered;
  progress.bookmarks = state.bookmarks;
  progress.wrongs = state.wrongs;
  saveUserProgress(username, progress);
}

function App() {
  const [view, setView] = useState('home');
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [practiceState, setPracticeState] = useState(() => {
    if (getCurrentUser()) {
      return { ...INITIAL_STATE, ...loadUserProgress(getCurrentUser()) };
    }
    return { ...INITIAL_STATE };
  });
  const [showNavigator, setShowNavigator] = useState(false);

  const activeSet = useMemo(
    () => questionSets.find((set) => set.id === practiceState.activeSetId),
    [practiceState.activeSetId]
  );

  const questionList = useMemo(() => {
    if (!activeSet) return [];
    if (practiceState.mode === 'wrong') {
      return activeSet.questions.filter((q) => practiceState.wrongs.includes(q.id));
    }
    if (practiceState.mode === 'bookmark') {
      return activeSet.questions.filter((q) => practiceState.bookmarks.includes(q.id));
    }
    return activeSet.questions;
  }, [activeSet, practiceState.mode, practiceState.wrongs, practiceState.bookmarks]);

  const question = questionList[practiceState.index] || null;
  const currentRecord = question ? practiceState.answered[question.id] : null;

  // Persist changes when logged in
  useEffect(() => {
    if (currentUser) {
      persistUserProgress(currentUser, practiceState);
    }
  }, [currentUser, practiceState.answered, practiceState.bookmarks, practiceState.wrongs]);

  // Sync practice state when user changes
  useEffect(() => {
    if (currentUser) {
      const progress = loadUserProgress(currentUser);
      setPracticeState((prev) => ({ ...prev, ...progress }));
    } else {
      setPracticeState({ ...INITIAL_STATE });
    }
  }, [currentUser]);

  // Auth handlers
  const handleLogin = useCallback((username) => {
    setCurrentUser(username);
  }, []);

  const handleLogout = useCallback(() => {
    logoutUser();
    setCurrentUser(null);
    setView('home');
    setShowNavigator(false);
  }, []);

  const openSet = useCallback((setId, mode = 'sequential') => {
    setPracticeState((prev) => ({
      ...prev,
      activeSetId: setId,
      mode,
      index: 0,
      selected: null,
    }));
    setShowNavigator(false);
    setView('practice');
  }, []);

  const goHome = useCallback(() => {
    setView('home');
    setShowNavigator(false);
  }, []);

  const chooseOption = useCallback((option) => {
    setPracticeState((prev) => {
      if (!questionList[prev.index]) return prev;
      const q = questionList[prev.index];
      if (prev.answered[q.id]) return prev;
      return { ...prev, selected: option };
    });
  }, [questionList]);

  const submitAnswer = useCallback(() => {
    setPracticeState((prev) => {
      const q = questionList[prev.index];
      if (!q || !prev.selected || prev.answered[q.id]) return prev;
      const isCorrect = prev.selected === q.answer;
      return {
        ...prev,
        answered: { ...prev.answered, [q.id]: prev.selected },
        wrongs: isCorrect ? prev.wrongs : prev.wrongs.includes(q.id) ? prev.wrongs : [...prev.wrongs, q.id],
      };
    });
  }, [questionList]);

  const navigateTo = useCallback((idx) => {
    setPracticeState((prev) => ({ ...prev, index: idx, selected: null }));
    setShowNavigator(false);
  }, []);

  const jumpNext = useCallback(() => {
    setPracticeState((prev) => {
      if (prev.index < questionList.length - 1) {
        return { ...prev, index: prev.index + 1, selected: null };
      }
      return prev;
    });
  }, [questionList.length]);

  const jumpPrev = useCallback(() => {
    setPracticeState((prev) => {
      if (prev.index > 0) {
        return { ...prev, index: prev.index - 1, selected: null };
      }
      return prev;
    });
  }, []);

  const toggleBookmark = useCallback(() => {
    setPracticeState((prev) => {
      const q = questionList[prev.index];
      if (!q) return prev;
      const exists = prev.bookmarks.includes(q.id);
      return {
        ...prev,
        bookmarks: exists ? prev.bookmarks.filter((id) => id !== q.id) : [...prev.bookmarks, q.id],
      };
    });
  }, [questionList]);

  const restart = useCallback(() => {
    setPracticeState((prev) => ({ ...prev, index: 0, selected: null, answered: {} }));
  }, []);

  const enterResult = useCallback(() => setView('result'), []);

  if (view === 'auth' || !currentUser) {
    if (view !== 'auth' && !currentUser) {
      setView('auth');
    }
    return <LoginPage onLogin={handleLogin} />;
  }

  // Practice page
  if (view === 'practice' && activeSet && question) {
    return (
      <PracticePage
        key={`${activeSet.id}-${practiceState.mode}`}
        set={activeSet}
        question={question}
        index={practiceState.index}
        listLength={questionList.length}
        selected={practiceState.selected}
        record={currentRecord}
        bookmarked={practiceState.bookmarks.includes(question.id)}
        answeredMap={practiceState.answered}
        showNavigator={showNavigator}
        onToggleNavigator={() => setShowNavigator((v) => !v)}
        onChoose={chooseOption}
        onSubmit={submitAnswer}
        onNext={jumpNext}
        onPrev={jumpPrev}
        onJumpTo={navigateTo}
        onBookmark={toggleBookmark}
        onBack={goHome}
        onFinish={enterResult}
        mode={practiceState.mode}
      />
    );
  }

  // Result page
  if (view === 'result' && activeSet) {
    return (
      <ResultPage
        set={activeSet}
        answered={practiceState.answered}
        wrongs={practiceState.wrongs}
        onRestart={restart}
        onHome={goHome}
        onReviewWrong={() => openSet(activeSet.id, 'wrong')}
      />
    );
  }

  // Wrongs page
  if (view === 'wrongs') {
    const setsWithWrongs = questionSets.map((set) => ({
      ...set,
      wrongQuestions: set.questions.filter((q) => practiceState.wrongs.includes(q.id)),
    })).filter((set) => set.wrongQuestions.length > 0);
    return (
      <WrongBookPage
        sets={setsWithWrongs}
        answered={practiceState.answered}
        onOpen={(setId) => openSet(setId, 'wrong')}
        onHome={goHome}
      />
    );
  }

  // Bookmarks page
  if (view === 'bookmarks-page') {
    const setsWithBookmarks = questionSets.map((set) => ({
      ...set,
      bookmarkQuestions: set.questions.filter((q) => practiceState.bookmarks.includes(q.id)),
    })).filter((set) => set.bookmarkQuestions.length > 0);
    return (
      <BookmarkPage
        sets={setsWithBookmarks}
        answered={practiceState.answered}
        onOpen={(setId) => openSet(setId, 'bookmark')}
        onHome={goHome}
      />
    );
  }

  return <HomePage onOpen={openSet} />;
}

/* ============================================================
   登录/注册页
   ============================================================ */
function LoginPage({ onLogin }) {
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = loginUser(username.trim(), password);
      if (result.success) {
        onLogin(username.trim());
      } else {
        setError(result.message);
      }
      setLoading(false);
    }, 300);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = registerUser(username.trim(), password);
      if (result.success) {
        // Auto login after register
        const loginResult = loginUser(username.trim(), password);
        if (loginResult.success) {
          onLogin(username.trim());
        }
      } else {
        setError(result.message);
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">知</div>
          <h1>知行题库</h1>
          <p>创建一个账户，记录你的练习进度</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            登录
          </button>
          <button
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >
            注册
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {tab === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin} style={{ marginTop: error ? 16 : 0 }}>
            <div className="form-group">
              <label>用户名</label>
              <input
                className="form-input"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>密码</label>
              <input
                className="form-input"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="auth-submit" type="submit" disabled={loading || !username || !password}>
              {loading ? '登录中...' : <><LogIn size={17} /> 登录</>}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister} style={{ marginTop: error ? 16 : 0 }}>
            <div className="form-group">
              <label>用户名</label>
              <input
                className="form-input"
                type="text"
                placeholder="2-20 个字符"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>密码</label>
              <input
                className="form-input"
                type="password"
                placeholder="至少 4 位"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="auth-submit" type="submit" disabled={loading || !username || !password}>
              {loading ? '注册中...' : <><User size={17} /> 注册</>}
            </button>
          </form>
        )}

        <div className="auth-footer">
          数据保存在本地浏览器 · 不同用户进度独立
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   用户菜单组件
   ============================================================ */
function UserMenu({ username, onLogout }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initial = (username || '?').charAt(0).toUpperCase();

  return (
    <div className="user-menu-container" ref={containerRef}>
      <button className="user-avatar-btn" onClick={() => setOpen(!open)}>
        <div className="user-avatar">{initial}</div>
        <span>{username}</span>
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-header">
            <b>{username}</b>
            <span>已登录</span>
          </div>
          <button
            className="user-dropdown-item"
            onClick={() => { setOpen(false); onLogout(); }}
          >
            <LogOut size={15} /> 退出登录
          </button>
        </div>
      )}
    </div>
  );
}
/* ============================================================
   首页 (带用户统计)
   ============================================================ */
function HomePage({ onOpen }) {
  const total = questionSets.reduce((sum, set) => sum + set.questions.length, 0);
  const [user, setUser] = useState(getCurrentUser());
  const progress = user ? getUserProgress(user) : null;

  const answeredCount = progress ? Object.keys(progress.answered || {}).length : 0;
  const bookmarksCount = progress ? (progress.bookmarks || []).length : 0;
  const wrongsCount = progress ? (progress.wrongs || []).length : 0;

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  const initial = (user || '?').charAt(0).toUpperCase();

  return (
    <main className="home-shell">
      <header className="topnav">
        <div className="logo">
          <div className="logo-mark">知</div>
          <div className="logo-text">
            <span className="logo-title">知行题库</span>
            <span className="logo-sub">北森考测 · 专项练习</span>
          </div>
        </div>
        <div className="nav-actions">
          {user ? (
            <UserMenu username={user} onLogout={handleLogout} />
          ) : (
            <button className="nav-btn-text" onClick={() => {}}>
              <LogIn size={16} /> 请登录
            </button>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-badge">EXAM READY · 2026</div>
            <h1>
              {user ? (
                <>
                  欢迎回来，<span className="hero-italic">{user}</span>
                  <br />
                  今天也要<span className="hero-italic">坚持刷题</span>
                </>
              ) : (
                <>
                  刷每一道题，
                  <br />
                  都在<span className="hero-italic">靠近上岸</span>
                </>
              )}
            </h1>
            <p className="hero-desc">
              {user
                ? `你已完成 ${answeredCount} 道题，收藏 ${bookmarksCount} 道，错题 ${wrongsCount} 道。继续加油！`
                : '三大专项 · 即时反馈 · 完整解析。登录后可保存你的练习进度。'}
            </p>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-num">{total}</span>
                <span className="stat-label">精选题目</span>
              </div>
              <div className="stat">
                <span className="stat-num">3</span>
                <span className="stat-label">专项题型</span>
              </div>
              <div className="stat">
                <span className="stat-num">{answeredCount}</span>
                <span className="stat-label">你的进度</span>
              </div>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-visual">
              <div className="visual-card visual-1">
                <BrainCircuit size={28} />
                <span>言语理解</span>
              </div>
              <div className="visual-card visual-2">
                <FileBarChart size={28} />
                <span>资料分析</span>
              </div>
              <div className="visual-card visual-3">
                <Grid2X2 size={28} />
                <span>图形推理</span>
              </div>
              <div className="visual-circle" />
            </div>
          </div>
        </div>
      </section>

      {user && (answeredCount > 0 || bookmarksCount > 0 || wrongsCount > 0) && (
        <section className="sets-section" style={{ marginTop: 32 }}>
          <div className="section-title">
            <h2>你的练习数据</h2>
          </div>
          <div className="user-stats-mini" style={{ maxWidth: 500, background: 'var(--card)', border: '1px solid var(--line)', padding: 20, borderRadius: 16 }}>
            <div className="user-stat-mini">
              <b>{answeredCount}</b>
              <span>已作答</span>
            </div>
            <div className="user-stat-mini">
              <b>{bookmarksCount}</b>
              <span>已收藏</span>
            </div>
            <div className="user-stat-mini">
              <b>{wrongsCount}</b>
              <span>错题数</span>
            </div>
            <div className="user-stat-mini">
              <b>{total > 0 ? Math.round((answeredCount / total) * 100) : 0}%</b>
              <span>完成率</span>
            </div>
          </div>
        </section>
      )}

      <section className="sets-section">
        <div className="section-title">
          <h2>选择专项开始练习</h2>
          <p>每道题提交后立即显示正确答案与详细解析</p>
        </div>
        <div className="set-grid">
          {questionSets.map((set) => (
            <SetCard key={set.id} set={set} onOpen={() => onOpen(set.id)} progress={progress} />
          ))}
        </div>
      </section>

      <section className="info-banner">
        <div className="info-icon"><Lightbulb size={22} /></div>
        <div className="info-content">
          <b>练习说明</b>
          <p>登录后逐题作答，提交后立刻反馈。可随时收藏题目、跳转到任意题号。答完一轮可在结果页进入错题重练，反复强化薄弱项。多账户数据完全隔离。</p>
        </div>
      </section>

      <footer className="home-footer">
        知行题库 · 专注北森考测 · {new Date().getFullYear()}
      </footer>
    </main>
  );
}

function SetCard({ set, onOpen, progress }) {
  // Calculate progress for this set
  const answeredInSet = progress
    ? set.questions.filter((q) => progress.answered && progress.answered[q.id]).length
    : 0;
  const wrongInSet = progress
    ? set.questions.filter((q) => progress.wrongs && progress.wrongs.includes(q.id)).length
    : 0;
  const progressPercent = set.questions.length > 0
    ? Math.round((answeredInSet / set.questions.length) * 100)
    : 0;

  return (
    <button className="set-card" onClick={onOpen} style={{ '--accent': set.accent, '--accent-bg': set.accentBg }}>
      <div className="set-card-top">
        <div className="set-icon">{renderIcon(set.id)}</div>
        <div className="set-count">
          <strong>{set.questions.length}</strong>
          <span>题</span>
        </div>
      </div>
      <div className="set-body">
        <h3>{set.title}</h3>
        <p>{set.subtitle}</p>
      </div>
      <div className="set-tags">
        {set.questions.slice(0, 3).map((q) => (
          <span key={q.id} className="set-tag">{q.tag}</span>
        ))}
        {set.questions.length > 3 && <span className="set-tag more">+{set.questions.length - 3}</span>}
      </div>
      {progress && answeredInSet > 0 && (
        <div className="set-progress-mini" style={{ marginTop: 14 }}>
          <div className="sp-bar" style={{ height: 4, borderRadius: 2, background: 'var(--line-soft)', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: set.accent, borderRadius: 2, transition: 'width .3s' }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginTop: 4 }}>
            已答 {answeredInSet}/{set.questions.length} · 错题 {wrongInSet}
          </span>
        </div>
      )}
      <div className="set-action">
        <span>{answeredInSet > 0 ? '继续练习' : '开始练习'}</span>
        <ChevronRight size={18} />
      </div>
    </button>
  );
}

function renderIcon(id) {
  if (id === 'verbal') return <BrainCircuit size={26} />;
  if (id === 'data') return <FileBarChart size={26} />;
  return <Grid2X2 size={26} />;
}

/* ============================================================
   刷题页
   ============================================================ */
function PracticePage({
  set, question, index, listLength, selected, record, bookmarked, answeredMap,
  showNavigator, onToggleNavigator, onChoose, onSubmit, onNext, onPrev,
  onJumpTo, onBookmark, onBack, onFinish, mode,
}) {
  const isCorrect = record === question.answer;
  const progress = ((index + (record ? 1 : 0)) / listLength) * 100;
  const isLast = index === listLength - 1;

  return (
    <div className="practice-shell">
      <header className="practice-header">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={17} /> 返回
        </button>
        <div className="practice-info">
          <span className="practice-set-badge" style={{ background: set.accentBg, color: set.accent }}>
            {renderIcon(set.id)} {set.title}
          </span>
          <span className="practice-mode">
            {mode === 'wrong' && '错题重练'}
            {mode === 'bookmark' && '收藏练习'}
            {mode === 'sequential' && '顺序练习'}
          </span>
        </div>
        <div className="practice-counter">
          第 <b>{index + 1}</b> / {listLength} 题
        </div>
      </header>

      <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

      <div className="practice-content">
        <article className="question-area">
          <div className="question-meta">
            <span className="tag">{question.tag}</span>
            <div className="meta-actions">
              <button className={`meta-btn ${bookmarked ? 'active' : ''}`} onClick={onBookmark}>
                <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} /> {bookmarked ? '已收藏' : '收藏'}
              </button>
            </div>
          </div>

          <div className="question-stem">
            {question.stem.split('\n').map((line, i) => (
              <p key={i}>{line || '\u00A0'}</p>
            ))}
          </div>

          {question.diagram && (
            <pre className="diagram">{question.diagram}</pre>
          )}

          {question.images && question.images.length > 0 && (
            <div className={`question-images ${set.id === 'graphic' ? 'graphic' : ''}`}>
              {question.images.map((img) => (
                <img
                  key={img}
                  src={`${import.meta.env.BASE_URL}question-bank/${img}`}
                  alt="题目图片"
                  loading="lazy"
                />
              ))}
            </div>
          )}

          <div className="options">
            {Object.entries(question.options).map(([letter, text]) => {
              let state = '';
              if (record) {
                state = letter === question.answer ? 'correct' : letter === record ? 'wrong' : 'dimmed';
              } else if (selected === letter) {
                state = 'selected';
              }
              return (
                <button key={letter} className={`option ${state}`} onClick={() => onChoose(letter)}>
                  <span className="option-key">{letter}</span>
                  <span className="option-text">{text}</span>
                  {state === 'correct' && <Check size={20} className="opt-icon ok" />}
                  {state === 'wrong' && <X size={19} className="opt-icon no" />}
                </button>
              );
            })}
          </div>

          {!record ? (
            <button className="btn-primary" disabled={!selected} onClick={onSubmit}>
              提交答案 <ArrowRight size={17} />
            </button>
          ) : (
            <div className={`feedback ${isCorrect ? 'ok' : 'no'}`}>
              <div className="feedback-head">
                <div className={`fb-icon ${isCorrect ? 'ok' : 'no'}`}>
                  {isCorrect ? <Check size={20} /> : <X size={20} />}
                </div>
                <div>
                  <h4>{isCorrect ? '回答正确，继续保持！' : '答对了别骄傲，答错了别气馁。'}</h4>
                  <p className="fb-answer">正确答案：<b>{question.answer}</b>{!isCorrect && <> · 你的答案：<b>{record}</b></>}</p>
                </div>
              </div>
              <div className="feedback-analysis">
                <div className="fb-ana-head"><Lightbulb size={16} /> 解析</div>
                <p>{question.analysis}</p>
              </div>
              <div className="feedback-actions">
                {isLast ? (
                  <button className="btn-primary" onClick={onFinish}>
                    查看结果 <Trophy size={16} />
                  </button>
                ) : (
                  <button className="btn-primary" onClick={onNext}>
                    下一题 <ArrowRight size={17} />
                  </button>
                )}
              </div>
            </div>
          )}
        </article>

        <aside className="navigator">
          <div className="nav-header">
            <h4><Grid2X2 size={18} /> 答题卡</h4>
            <button className="nav-toggle" onClick={onToggleNavigator}>
              {showNavigator ? '收起' : '展开'}
            </button>
          </div>
          <div className="nav-legend">
            <span className="legend ok"><i /> 正确</span>
            <span className="legend no"><i /> 错误</span>
            <span className="legend done"><i /> 已答</span>
            <span className="legend cur"><i /> 当前</span>
          </div>
          <div className={`nav-grid ${showNavigator ? 'expanded' : ''}`}>
            {set.questions.map((q, idx) => {
              const answered = answeredMap[q.id];
              const isCur = q.id === question.id;
              let cls = '';
              if (isCur) cls = 'cur';
              else if (answered === q.answer) cls = 'ok';
              else if (answered) cls = 'no';
              return (
                <button key={q.id} className={`nav-cell ${cls}`} onClick={() => onJumpTo(idx)}>
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="nav-stats">
            <div className="ns-row">
              <span>已作答</span>
              <b>{set.questions.filter((q) => answeredMap[q.id]).length}/{set.questions.length}</b>
            </div>
            <div className="ns-row">
              <span>正确</span>
              <b>{set.questions.filter((q) => answeredMap[q.id] === q.answer).length}</b>
            </div>
            <div className="ns-row">
              <span>收藏</span>
              <b>{set.questions.filter((q) => bookmarked).length}</b>
            </div>
            <div className="ns-row">
              <span>进度</span>
              <b>{Math.round(progress)}%</b>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ============================================================
   结果页
   ============================================================ */
function ResultPage({ set, answered, wrongs, onRestart, onHome, onReviewWrong }) {
  const total = set.questions.length;
  const answeredCount = set.questions.filter((q) => answered[q.id]).length;
  const correctCount = set.questions.filter((q) => answered[q.id] === q.answer).length;
  const wrongCount = answeredCount - correctCount;
  const rate = answeredCount === 0 ? 0 : Math.round((correctCount / answeredCount) * 100);
  const scoreDeg = rate * 3.6;

  return (
    <div className="result-shell">
      <div className="result-card">
        <div className="result-badge">PRACTICE RESULT</div>
        <div className="result-icon-wrap">
          <div className="result-score-ring" style={{ '--deg': `${scoreDeg}deg` }}>
            <div>
              <strong>{rate}%</strong>
              <span>正确率</span>
            </div>
          </div>
        </div>
        <h1>本轮练习完成</h1>
        <p className="result-sub">{set.title} · 共 {answeredCount} 题已作答</p>

        <div className="result-stats">
          <div className="rs-item">
            <Trophy size={18} />
            <b>{correctCount}</b>
            <span>答对</span>
          </div>
          <div className="rs-item">
            <X size={18} />
            <b>{wrongCount}</b>
            <span>答错</span>
          </div>
          <div className="rs-item">
            <Target size={18} />
            <b>{total}</b>
            <span>总计</span>
          </div>
        </div>

        {wrongCount > 0 && (
          <button className="btn-wrong" onClick={onReviewWrong}>
            <Flame size={17} /> 复习错题 {wrongCount} 道
          </button>
        )}

        <div className="result-actions">
          <button className="btn-secondary" onClick={onHome}><Home size={17} /> 返回首页</button>
          <button className="btn-primary" onClick={onRestart}><RotateCcw size={17} /> 再练一次</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   错题本
   ============================================================ */
function WrongBookPage({ sets, answered, onOpen, onHome }) {
  const totalWrong = sets.reduce((s, set) => s + set.wrongQuestions.length, 0);
  if (totalWrong === 0) {
    return (
      <div className="empty-shell">
        <div className="empty-card">
          <div className="empty-icon ok"><Check size={36} /></div>
          <h2>恭喜，还没有错题！</h2>
          <p>继续保持，每一次练习都是积累。</p>
          <button className="btn-primary" onClick={onHome}><Home size={17} /> 返回首页</button>
        </div>
      </div>
    );
  }
  return (
    <div className="list-shell">
      <header className="list-header">
        <button className="btn-back" onClick={onHome}><ArrowLeft size={17} /> 返回</button>
        <h2><Flame size={22} /> 错题本</h2>
        <span className="list-count">{totalWrong} 道错题</span>
      </header>
      <div className="list-content">
        {sets.map((set) => (
          <div key={set.id} className="list-section">
            <div className="ls-head">
              <div className="ls-title">
                <span className="ls-icon" style={{ background: set.accentBg, color: set.accent }}>{renderIcon(set.id)}</span>
                <b>{set.title}</b>
              </div>
              <span className="ls-count">{set.wrongQuestions.length} 题</span>
            </div>
            <button className="ls-practice" onClick={() => onOpen(set.id)}>
              开始练习 <ArrowRight size={16} />
            </button>
            <div className="ls-list">
              {set.wrongQuestions.slice(0, 5).map((q) => (
                <div key={q.id} className="ls-item">
                  <span className="ls-tag">{q.tag}</span>
                  <p>{q.stem.slice(0, 60)}…</p>
                  <span className="ls-ans">正确答案：<b>{q.answer}</b> · 你的答案：<b className="wrong">{answered[q.id]}</b></span>
                </div>
              ))}
              {set.wrongQuestions.length > 5 && <div className="ls-more">还有 {set.wrongQuestions.length - 5} 道…</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   收藏页
   ============================================================ */
function BookmarkPage({ sets, answered, onOpen, onHome }) {
  const total = sets.reduce((s, set) => s + set.bookmarkQuestions.length, 0);
  if (total === 0) {
    return (
      <div className="empty-shell">
        <div className="empty-card">
          <div className="empty-icon"><Star size={36} /></div>
          <h2>还没有收藏题目</h2>
          <p>遇到好题，点击收藏按钮随时回味。</p>
          <button className="btn-primary" onClick={onHome}><Home size={17} /> 返回首页</button>
        </div>
      </div>
    );
  }
  return (
    <div className="list-shell">
      <header className="list-header">
        <button className="btn-back" onClick={onHome}><ArrowLeft size={17} /> 返回</button>
        <h2><Bookmark size={22} /> 收藏题目</h2>
        <span className="list-count">{total} 道收藏</span>
      </header>
      <div className="list-content">
        {sets.map((set) => (
          <div key={set.id} className="list-section">
            <div className="ls-head">
              <div className="ls-title">
                <span className="ls-icon" style={{ background: set.accentBg, color: set.accent }}>{renderIcon(set.id)}</span>
                <b>{set.title}</b>
              </div>
              <span className="ls-count">{set.bookmarkQuestions.length} 题</span>
            </div>
            <button className="ls-practice" onClick={() => onOpen(set.id)}>
              开始练习 <ArrowRight size={16} />
            </button>
            <div className="ls-list">
              {set.bookmarkQuestions.map((q) => (
                <div key={q.id} className="ls-item">
                  <span className="ls-tag">{q.tag}</span>
                  <p>{q.stem.slice(0, 60)}…</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
