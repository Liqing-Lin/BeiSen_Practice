import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bookmark,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleHelp,
  FileBarChart,
  Flag,
  Grid2X2,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import './styles.css';

const questionSets = [
  {
    id: 'verbal',
    title: '言语理解',
    subtitle: '片段阅读 · 逻辑填空 · 主旨判断',
    count: 321,
    icon: BrainCircuit,
    tone: 'amber',
    questions: [
      {
        id: 'v-1',
        stem: '高新科技成果转化为生产力，有一个客观的转化过程。从基础理论到技术研究，进而设计、开发、研制出样品、样机，从试验或小批生产到建立经济规模的生产及相应的经营管理和销售服务，高科技成果转化成为具有使用价值和经济效益的社会生产力，要经过许多环节，要做大量具体的转化工作。其中，应特别注意的是必须切实解决经济规模生产的工艺问题。对这段话最准确的复述是：',
        options: {
          A: '高新科技成果转化为生产力要经许多环节和做大量具体的转化工作',
          B: '解决经济规模生产的工艺问题是高新科技成果转化为生产力的首要任务',
          C: '解决经济规模生产的工艺问题与设计、开发等问题同等重要',
          D: '高新科技成果转化为生产力要做许多具体工作，主要包括解决经济规模生产的工艺问题',
        },
        answer: 'D',
        analysis: '文段先说明成果转化需要经过多个环节，再以“特别注意”“必须”强调要解决经济规模生产的工艺问题。D 项完整概括了主旨。A 项遗漏重点；B 项“首要任务”无中生有；C 项未体现整体转化过程。',
        tag: '主旨概括',
      },
      {
        id: 'v-2',
        stem: '每个人在学习新事物时都会有恐惧、畏难的心态，但如果因此而（ ），那我们就永远也学习不到新知识。填入括号内最恰当的词语是：',
        options: { A: '因噎废食', B: '瞻前顾后', C: '首鼠两端', D: '视为畏途' },
        answer: 'D',
        analysis: '“视为畏途”比喻把事情看得艰难可怕而不敢去做，与“对学习新事物有畏难心态，因而不再学习”的语境最契合。',
        tag: '逻辑填空',
      },
      {
        id: 'v-3',
        stem: '人们通常把个人成长看作是容易识别和衡量的外在行为表现，例如青年不痴迷于游戏，学生掌握了一门新语言等。由材料推论，一个人如果被大家认为取得了成长，通常是因为：',
        options: { A: '在工作中很努力', B: '克服掉了抽烟的习惯', C: '渴望学习新的事物', D: '不断接受挑战' },
        answer: 'B',
        analysis: '题干强调“被大家认为”的成长，依据是可识别、可衡量的外在行为表现。B 项是具体可观察的行为改变，符合文意。',
        tag: '细节判断',
      },
    ],
  },
  {
    id: 'data',
    title: '资料分析',
    subtitle: '图表阅读 · 比例计算 · 增长比较',
    count: 254,
    icon: FileBarChart,
    tone: 'sage',
    questions: [
      {
        id: 'd-1',
        stem: '近年智能手机市场竞争激烈。某地 A、B 两款手机过去四年的新用户数如下：A 手机分别为 9800、11000、15000、18000 人；B 手机分别为 2500、4330、8500、14000 人。A 手机用户与 B 手机用户相比，以下正确的是：',
        options: {
          A: '过去四年，该地区 A 手机的新用户总量大于 B 手机的新用户总量',
          B: '过去四年，B 手机新用户的增长速度低于 A 手机新用户的增长速度',
          C: '过去四年，B 手机在第二年的新用户增长率低于 A 手机的新用户增长率',
          D: '过去四年，该地区 A 手机新用户数和 B 手机新用户数接近',
        },
        answer: 'A',
        analysis: 'A 手机总量为 9800+11000+15000+18000=53800；B 手机总量为 2500+4330+8500+14000=29330，A 大于 B。B 的累计增长速度为 4.6，高于 A 的 83.7%；第二年 B 的增长率也高于 A。',
        tag: '增长比较',
      },
      {
        id: 'd-2',
        stem: '一项社会调查共发放 500 份问卷。统计发现有效问卷为 495 份，其中选择“知心朋友最重要”的受访者有 150 人；这部分人中 16% 对生活感到满意。认为知心朋友最重要而且对生活感到满意的，大约有多少人？',
        options: { A: '24', B: '73', C: '65', D: '信息不足，无法评价' },
        answer: 'A',
        analysis: '所求人数为 150 × 16% = 24 人。有效问卷数是判断图表口径的信息，不影响本题计算。',
        tag: '比例计算',
      },
      {
        id: 'd-3',
        stem: '某公司北京、上海、广州、深圳、杭州五家门店的汽车销售量分别为 180、220、215、198、206 台。北京店的汽车销售量占总量的比例约为：',
        options: { A: '20.5%', B: '21.0%', C: '22.5%', D: '21.6%' },
        answer: 'D',
        analysis: '总销量为 180+220+215+198+206=1019 台，北京店占比为 220÷1019≈21.6%。',
        tag: '比重计算',
      },
    ],
  },
  {
    id: 'graphic',
    title: '图形推理',
    subtitle: '规律识别 · 图形叠加 · 空间想象',
    count: 152,
    icon: Grid2X2,
    tone: 'coral',
    questions: [
      {
        id: 'g-1',
        stem: '观察每组图形的关系：前两个图形均含有圆形，第三个图形保留圆形；前两个图形均由两个元素组成，第三个图形只保留一个元素。按同样规律，后面一组图形的空缺处应选择：',
        diagram: '○＋△    ○＋□    ○\n△＋□    △＋☆    ？',
        options: { A: '□', B: '☆', C: '△', D: '○' },
        answer: 'C',
        analysis: '前一组中，两个图形共有的元素是圆形，且均有两个元素，因此第三图保留共同元素圆形并化为单元素。后一组前两图共同元素为三角形，故选 C。',
        tag: '元素求同',
      },
      {
        id: 'g-2',
        stem: '在一个 3×3 图形矩阵中，每一行前两个图形叠加后得到第三个图形，重合部分不显示。问号处最可能的图形是：',
        diagram: '┌  +  ┐  =  ┬\n│  +  ─  =  ├\n└  +  ─  =  ？',
        options: { A: '┘', B: '┴', C: '┼', D: '┐' },
        answer: 'B',
        analysis: '题目考查图形叠加：前两图不重合的线条共同保留。第三行中“└”与横线叠加，保留底边与横线形成的结构，对应 B。',
        tag: '图形叠加',
      },
      {
        id: 'g-3',
        stem: '下列图形中不同于其他图形的一项是：',
        options: { A: '由三个独立图形元素组成', B: '由两个独立图形元素组成', C: '由两个独立图形元素组成', D: '由两个独立图形元素组成' },
        answer: 'A',
        analysis: 'B、C、D 均由两个图形元素组成，只有 A 由三个元素组成，因此 A 为不同项。',
        tag: '分类推理',
      },
    ],
  },
];

function App() {
  const [screen, setScreen] = useState('home');
  const [activeSetId, setActiveSetId] = useState(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState({});
  const [bookmarks, setBookmarks] = useState(new Set());

  const activeSet = useMemo(() => questionSets.find((set) => set.id === activeSetId), [activeSetId]);
  const question = activeSet?.questions[index];
  const currentRecord = question ? answered[question.id] : null;

  const openSet = (setId) => {
    setActiveSetId(setId);
    setIndex(0);
    setSelected(null);
    setScreen('practice');
  };

  const chooseOption = (option) => {
    if (currentRecord) return;
    setSelected(option);
  };

  const submitAnswer = () => {
    if (!selected || !question) return;
    setAnswered((previous) => ({ ...previous, [question.id]: selected }));
  };

  const goNext = () => {
    if (index < activeSet.questions.length - 1) {
      setIndex((value) => value + 1);
      setSelected(null);
    } else {
      setScreen('result');
    }
  };

  const resetPractice = () => {
    const ids = activeSet.questions.map((item) => item.id);
    setAnswered((previous) => {
      const copy = { ...previous };
      ids.forEach((id) => delete copy[id]);
      return copy;
    });
    setIndex(0);
    setSelected(null);
    setScreen('practice');
  };

  const toggleBookmark = () => {
    setBookmarks((previous) => {
      const next = new Set(previous);
      next.has(question.id) ? next.delete(question.id) : next.add(question.id);
      return next;
    });
  };

  if (screen === 'practice' && activeSet && question) {
    const doneCount = activeSet.questions.filter((item) => answered[item.id]).length;
    const isCorrect = currentRecord === question.answer;
    return (
      <PracticePage
        set={activeSet}
        question={question}
        index={index}
        doneCount={doneCount}
        selected={selected}
        record={currentRecord}
        isCorrect={isCorrect}
        bookmarked={bookmarks.has(question.id)}
        onBack={() => setScreen('home')}
        onChoose={chooseOption}
        onSubmit={submitAnswer}
        onNext={goNext}
        onBookmark={toggleBookmark}
      />
    );
  }

  if (screen === 'result' && activeSet) {
    const completed = activeSet.questions.filter((item) => answered[item.id]);
    const correct = completed.filter((item) => answered[item.id] === item.answer).length;
    return <ResultPage set={activeSet} correct={correct} total={activeSet.questions.length} onRestart={resetPractice} onHome={() => setScreen('home')} />;
  }

  return <HomePage onOpen={openSet} />;
}

function HomePage({ onOpen }) {
  const total = questionSets.reduce((sum, item) => sum + item.count, 0);
  return (
    <main className="home-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <nav className="topbar">
        <div className="brand"><span className="brand-mark">知</span><span>知行题库</span></div>
        <div className="nav-note"><Sparkles size={16} /> 北森测评专项练习</div>
      </nav>
      <section className="hero">
        <div className="eyebrow"><span /> FOCUS · PRACTICE · GROW</div>
        <h1>每一次选择，<em>都更接近答案。</em></h1>
        <p>从真实题库出发，逐题作答、即时反馈。把模糊的感觉，练成清晰的判断。</p>
        <div className="hero-metrics">
          <div><strong>{total}</strong><span>已收录题目</span></div>
          <div><strong>3</strong><span>专项题型</span></div>
          <div><strong>即时</strong><span>答案解析</span></div>
        </div>
      </section>
      <section className="section-head"><div><span className="eyebrow mini"><span /> CHOOSE A SET</span><h2>选择一个专项开始</h2></div><p>每道题提交后立即显示答案与解析</p></section>
      <section className="category-grid">
        {questionSets.map((set, position) => <CategoryCard key={set.id} set={set} position={position} onOpen={() => onOpen(set.id)} />)}
      </section>
      <section className="how-it-works"><div className="method-title"><Lightbulb size={22} /><div><b>练习方式</b><span>专注一题，理解一题</span></div></div><div className="method-step"><i>01</i>选择专项</div><div className="method-step"><i>02</i>作答提交</div><div className="method-step"><i>03</i>即时复盘</div></section>
    </main>
  );
}

function CategoryCard({ set, position, onOpen }) {
  const Icon = set.icon;
  return <button className={`category-card ${set.tone}`} onClick={onOpen} style={{ '--delay': `${position * 90}ms` }}>
    <div className="card-top"><div className="icon-box"><Icon size={27} strokeWidth={1.7} /></div><span className="card-arrow"><ChevronRight size={20} /></span></div>
    <div className="card-copy"><h3>{set.title}</h3><p>{set.subtitle}</p></div>
    <div className="card-bottom"><strong>{set.count}</strong><span>道精选题</span><span className="start-label">开始练习 <ArrowRight size={15} /></span></div>
    <div className="card-grid-art" />
  </button>;
}

function PracticePage({ set, question, index, doneCount, selected, record, isCorrect, bookmarked, onBack, onChoose, onSubmit, onNext, onBookmark }) {
  const progress = ((index + (record ? 1 : 0)) / set.questions.length) * 100;
  return <main className="practice-shell">
    <header className="practice-topbar"><button className="back-button" onClick={onBack}><ArrowLeft size={18} /> 返回题型</button><div className="practice-brand"><span className="brand-mark">知</span> 知行题库</div><div className="question-counter">第 <b>{index + 1}</b> / {set.questions.length} 题</div></header>
    <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
    <div className="practice-layout">
      <aside className="practice-side"><div className="set-pill"><span className={`mini-icon ${set.tone}`}>{React.createElement(set.icon, { size: 17 })}</span><span>{set.title}</span></div><div className="side-stat"><b>{doneCount}</b><span>本次已作答</span></div><div className="side-tip"><CircleHelp size={17} /><p>选择答案后提交，即可查看详细解析。</p></div></aside>
      <section className="question-panel">
        <div className="question-meta"><span>{question.tag}</span><button className={bookmarked ? 'bookmark active' : 'bookmark'} onClick={onBookmark}><Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} /> {bookmarked ? '已收藏' : '收藏'}</button></div>
        <h1>{question.stem}</h1>
        {question.diagram && <pre className="diagram">{question.diagram}</pre>}
        <div className="options">{Object.entries(question.options).map(([letter, text]) => {
          const state = record ? (letter === question.answer ? 'correct' : letter === record ? 'wrong' : '') : selected === letter ? 'selected' : '';
          return <button key={letter} className={`option ${state}`} onClick={() => onChoose(letter)}><span className="option-letter">{letter}</span><span className="option-text">{text}</span>{state === 'correct' && <Check size={20} />}{state === 'wrong' && <X size={19} />}</button>;
        })}</div>
        {!record ? <button className="submit-button" disabled={!selected} onClick={onSubmit}>提交答案 <ArrowRight size={18} /></button> : <Feedback correct={isCorrect} question={question} onNext={onNext} isLast={index === set.questions.length - 1} />}
      </section>
    </div>
  </main>;
}

function Feedback({ correct, question, onNext, isLast }) {
  return <section className={`feedback ${correct ? 'correct-feedback' : 'wrong-feedback'}`}><div className="feedback-status"><span>{correct ? <Check size={21} /> : <X size={21} />}</span><div><h3>{correct ? '回答正确，继续保持！' : '这题先记下，理解规律更重要。'}</h3><p>正确答案：<b>{question.answer}</b></p></div></div><div className="analysis"><div><Lightbulb size={17} /> 解析</div><p>{question.analysis}</p></div><button className="next-button" onClick={onNext}>{isLast ? '查看练习结果' : '下一题'} <ArrowRight size={18} /></button></section>;
}

function ResultPage({ set, correct, total, onRestart, onHome }) {
  const rate = Math.round((correct / total) * 100);
  return <main className="result-shell"><div className="result-card"><div className="result-icon"><Target size={34} /></div><span className="eyebrow mini"><span /> PRACTICE COMPLETE</span><h1>本轮练习完成</h1><p>{set.title} · 你已完成本次练习</p><div className="score-ring" style={{ '--score': `${rate * 3.6}deg` }}><div><strong>{rate}%</strong><span>正确率</span></div></div><div className="result-stats"><div><b>{correct}</b><span>答对题数</span></div><div><b>{total - correct}</b><span>待复习</span></div><div><b>{total}</b><span>练习题数</span></div></div><div className="result-actions"><button className="secondary-action" onClick={onHome}>返回题型</button><button className="primary-action" onClick={onRestart}><RotateCcw size={17} /> 再练一次</button></div></div></main>;
}

createRoot(document.getElementById('root')).render(<App />);
