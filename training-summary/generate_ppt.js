const pptxgen = require("pptxgenjs");

let pres = new pptxgen();
pres.author = '王子期游泳训练';
pres.title = '2026 IYSC青少年游泳挑战赛训练总结汇报';

// ============================================================
// SLIDE DIMENSIONS
// ============================================================
pres.layout = 'LAYOUT_16x9';
const SLIDE_W = 10;
const SLIDE_H = 5.625;
const MARGIN = 0.5;
const CONTENT_X = MARGIN;
const CONTENT_Y = MARGIN;
const CONTENT_W = SLIDE_W - (2 * MARGIN);
const CONTENT_H = SLIDE_H - (2 * MARGIN);
const CENTER_X = SLIDE_W / 2;
const CENTER_Y = SLIDE_H / 2;

// ============================================================
// CONTAINER SYSTEM
// ============================================================
function calculateScaledImageOpts(opts) {
  const { path, w: targetW, h: targetH, x = 0, y = 0, mode = 'cover', ...rest } = opts;
  if (!path || !targetW || !targetH) return opts;
  return { path, x, y, w: targetW, h: targetH, sizing: { type: mode, w: targetW, h: targetH }, ...rest };
}

function createVirtualNode(type, data, parentX = 0, parentY = 0) {
  const opts = data.opts || {};
  const node = {
    type, data,
    absX: parentX + (opts.x || 0),
    absY: parentY + (opts.y || 0),
    w: opts.w || 0, h: opts.h || 0,
    children: []
  };
  node.addShape = function(shapeType, opts = {}) {
    const child = createVirtualNode('shape', { shapeType, opts }, node.absX, node.absY);
    node.children.push(child);
    return child;
  };
  node.addText = function(text, opts = {}) {
    const safeOpts = { fit: "shrink", ...opts };
    const child = createVirtualNode('text', { text, opts: safeOpts }, node.absX, node.absY);
    node.children.push(child);
    return child;
  };
  node.addImage = function(opts = {}) {
    const scaledOpts = calculateScaledImageOpts(opts);
    const child = createVirtualNode('image', { opts: scaledOpts }, node.absX, node.absY);
    node.children.push(child);
    return child;
  };
  node.addTable = function(tableData, opts = {}) {
    const child = createVirtualNode('table', { tableData, opts }, node.absX, node.absY);
    node.children.push(child);
    return child;
  };
  return node;
}

function flattenNode(node, realSlide, pres) {
  const absOpts = { ...node.data.opts, x: node.absX, y: node.absY };
  if (node.type === 'shape') realSlide.addShape(node.data.shapeType, absOpts);
  else if (node.type === 'text') realSlide.addText(node.data.text, absOpts);
  else if (node.type === 'image') realSlide.addImage(absOpts);
  else if (node.type === 'table') realSlide.addTable(node.data.tableData, absOpts);
  node.children.forEach(child => flattenNode(child, realSlide, pres));
}

const originalAddSlide = pres.addSlide.bind(pres);
pres.addSlide = function(options) {
  const realSlide = originalAddSlide(options);
  const virtualSlide = {
    children: [],
    _realSlide: realSlide,
    set background(val) { realSlide.background = val; },
    get background() { return realSlide.background; },
    addShape: function(shapeType, opts = {}) {
      const node = createVirtualNode('shape', { shapeType, opts }, 0, 0);
      this.children.push(node);
      return node;
    },
    addText: function(text, opts = {}) {
      const safeOpts = { fit: "shrink", ...opts };
      const node = createVirtualNode('text', { text, opts: safeOpts }, 0, 0);
      this.children.push(node);
      return node;
    },
    addImage: function(opts = {}) {
      const scaledOpts = calculateScaledImageOpts(opts);
      const node = createVirtualNode('image', { opts: scaledOpts }, 0, 0);
      this.children.push(node);
      return node;
    },
    addTable: function(tableData, opts = {}) {
      const node = createVirtualNode('table', { tableData, opts }, 0, 0);
      this.children.push(node);
      return node;
    },
    addChart: function(chartType, data, opts = {}) {
      realSlide.addChart(chartType, data, opts);
    },
    render: function() {
      this.children.forEach(child => flattenNode(child, realSlide, pres));
    }
  };
  return virtualSlide;
};

// ============================================================
// COLOR PALETTE - Ocean Gradient
// ============================================================
const COLORS = {
  primary: '065A82',      // 深海蓝
  secondary: '1C7293',    // 青色
  accent: '21295C',       // 午夜蓝
  light: 'CADCFC',        // 冰蓝
  white: 'FFFFFF',
  offWhite: 'F0F6FF',
  dark: '0F1E3D',
  gold: 'F59E0B',
  silver: '94A3B8',
  bronze: 'CD7F32',
  success: '10B981',
  danger: 'EF4444',
  textDark: '1E293B',
  textMuted: '64748B',
  textLight: 'E2E8F0'
};

const IMG_DIR = '/workspace/training-summary/images/';

// ============================================================
// HELPER: 圆角卡片背景
// ============================================================
function addCard(slide, x, y, w, h, options = {}) {
  slide.addShape('rect', {
    x, y, w, h,
    rectRadius: 0.12,
    fill: { color: options.fill || COLORS.white },
    line: { color: options.line || 'E2E8F0', width: 1 },
    shadow: options.shadow !== false ? { type: 'outer', color: '000000', blur: 4, offset: 1, opacity: 0.06 } : undefined
  });
}

// ============================================================
// Slide 1: 封面
// ============================================================
let slide = pres.addSlide();
slide.background = { path: IMG_DIR + 'bg-cover.jpg' };

// 深色渐变遮罩
slide.addShape('rect', {
  x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
  fill: { color: COLORS.dark, transparency: 50 }
});

// 标题
slide.addText('2026 IYSC青少年游泳挑战赛', {
  x: 0.5, y: 1.5, w: 9, h: 0.7,
  fontSize: 32, bold: true, color: COLORS.white,
  align: 'center', valign: 'middle',
  charSpacing: 2.5
});

slide.addText('（佛山站）训练总结汇报', {
  x: 0.5, y: 2.2, w: 9, h: 0.6,
  fontSize: 22, color: COLORS.light,
  align: 'center', valign: 'middle'
});

// 运动员信息
slide.addShape('rect', {
  x: 3.5, y: 3.3, w: 3, h: 0.06,
  fill: { color: COLORS.gold }
});

slide.addText('王子期 · 越浪顶尖', {
  x: 0.5, y: 3.6, w: 9, h: 0.5,
  fontSize: 18, color: COLORS.light,
  align: 'center'
});

slide.addText('2026年8月22日', {
  x: 0.5, y: 4.1, w: 9, h: 0.4,
  fontSize: 14, color: 'CBD5E1',
  align: 'center'
});

slide.render();

// ============================================================
// Slide 2: 目录
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.offWhite };

// 顶部装饰条
slide.addShape('rect', {
  x: 0, y: 0, w: SLIDE_W, h: 0.12,
  fill: { color: COLORS.primary }
});

slide.addText('目录', {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 28, bold: true, color: COLORS.primary,
  charSpacing: 1.5
});

slide.addShape('rect', {
  x: 0.5, y: 1.0, w: 0.6, h: 0.05,
  fill: { color: COLORS.gold }
});

const agendaItems = [
  { num: '01', title: '比赛概况', desc: '赛事信息与参赛项目统计' },
  { num: '02', title: '奖牌榜', desc: '获奖项目与成绩亮点' },
  { num: '03', title: '成绩对比', desc: '各项目历史最佳 vs 本次比赛' },
  { num: '04', title: '进步明细', desc: '刷新PB项目详细分析' },
  { num: '05', title: '训练总结', desc: '训练效果与后续方向' },
];

agendaItems.forEach((item, i) => {
  const y = 1.4 + i * 0.75;
  // 序号圆
  slide.addShape('ellipse', {
    x: 0.8, y: y + 0.05, w: 0.5, h: 0.5,
    fill: { color: i === 0 ? COLORS.primary : COLORS.light }
  });
  slide.addText(item.num, {
    x: 0.8, y: y + 0.05, w: 0.5, h: 0.5,
    fontSize: 14, bold: true,
    color: i === 0 ? COLORS.white : COLORS.primary,
    align: 'center', valign: 'middle'
  });
  // 标题
  slide.addText(item.title, {
    x: 1.5, y: y, w: 5, h: 0.35,
    fontSize: 18, bold: true, color: COLORS.textDark
  });
  // 描述
  slide.addText(item.desc, {
    x: 1.5, y: y + 0.32, w: 5, h: 0.25,
    fontSize: 12, color: COLORS.textMuted
  });
});

// 右侧图片
slide.addImage({
  path: IMG_DIR + 'swim-dive.jpg',
  x: 6.5, y: 1.4, w: 3, h: 3.5,
  mode: 'cover',
  rectRadius: 0.1
});

slide.render();

// ============================================================
// Slide 3: 比赛概况
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.white };

// 标题区
slide.addShape('rect', { x: 0, y: 0, w: 0.1, h: SLIDE_H, fill: { color: COLORS.primary } });
slide.addText('比赛概况', {
  x: 0.5, y: 0.35, w: 9, h: 0.55,
  fontSize: 26, bold: true, color: COLORS.primary,
  charSpacing: 1.5
});
slide.addText('2026 IYSC青少年游泳挑战赛（佛山站）', {
  x: 0.5, y: 0.9, w: 9, h: 0.35,
  fontSize: 13, color: COLORS.textMuted
});

// 4个数据卡片
const stats = [
  { value: '10', label: '参赛项目', unit: '项', color: COLORS.primary },
  { value: '1', label: '金牌', unit: '枚', color: COLORS.gold },
  { value: '2', label: '银牌', unit: '枚', color: COLORS.silver },
  { value: '6', label: '刷新PB', unit: '项', color: COLORS.success },
];

stats.forEach((s, i) => {
  const x = 0.5 + i * 2.25;
  const y = 1.5;
  const w = 2.0;
  const h = 1.8;
  
  addCard(slide, x, y, w, h);
  
  slide.addText(s.value + s.unit, {
    x: x, y: y + 0.3, w: w, h: 0.9,
    fontSize: 36, bold: true, color: s.color,
    align: 'center'
  });
  slide.addShape('rect', {
    x: x + w * 0.35, y: y + 1.25, w: w * 0.3, h: 0.04,
    fill: { color: s.color }
  });
  slide.addText(s.label, {
    x: x, y: y + 1.4, w: w, h: 0.3,
    fontSize: 13, color: COLORS.textDark,
    align: 'center'
  });
});

// 参赛项目列表
slide.addText('参赛项目一览', {
  x: 0.5, y: 3.6, w: 5, h: 0.35,
  fontSize: 16, bold: true, color: COLORS.textDark
});

const events = ['50米蝶泳', '100米蝶泳', '50米自由泳', '100米自由泳', '200米自由泳',
                '50米仰泳', '100米仰泳', '50米蛙泳', '100米蛙泳', '200米个人混合泳'];

events.forEach((e, i) => {
  const row = Math.floor(i / 5);
  const col = i % 5;
  const x = 0.5 + col * 1.75;
  const y = 4.05 + row * 0.55;
  
  slide.addShape('ellipse', {
    x: x, y: y + 0.1, w: 0.28, h: 0.28,
    fill: { color: COLORS.light }
  });
  slide.addText('🏊', {
    x: x, y: y + 0.1, w: 0.28, h: 0.28,
    fontSize: 10, align: 'center', valign: 'middle'
  });
  slide.addText(e, {
    x: x + 0.32, y: y + 0.08, w: 1.4, h: 0.32,
    fontSize: 12, color: COLORS.textDark,
    valign: 'middle'
  });
});

slide.render();

// ============================================================
// Slide 4: 奖牌榜
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.offWhite };

slide.addShape('rect', { x: 0, y: 0, w: 0.1, h: SLIDE_H, fill: { color: COLORS.primary } });
slide.addText('奖牌榜', {
  x: 0.5, y: 0.35, w: 9, h: 0.55,
  fontSize: 26, bold: true, color: COLORS.primary,
  charSpacing: 1.5
});
slide.addText('收获1金2银，10项全面参赛', {
  x: 0.5, y: 0.9, w: 9, h: 0.35,
  fontSize: 13, color: COLORS.textMuted
});

// 3个奖牌卡片
const medals = [
  { rank: '🥇', rankText: '第1名', event: '200米自由泳', time: '2:36.71', color: COLORS.gold, bg: 'FEF3C7' },
  { rank: '🥈', rankText: '第2名', event: '50米蝶泳', time: '37.01', color: '6B7280', bg: 'F3F4F6' },
  { rank: '🥈', rankText: '第2名', event: '100米蝶泳', time: '1:22.61', color: '6B7280', bg: 'F3F4F6' },
];

medals.forEach((m, i) => {
  const x = 0.5 + i * 3;
  const y = 1.5;
  const w = 2.7;
  const h = 2.6;
  
  addCard(slide, x, y, w, h);
  
  // 顶部色条
  slide.addShape('rect', {
    x: x, y: y, w: w, h: 0.12,
    fill: { color: m.color }
  });
  
  // 奖牌图标
  slide.addText(m.rank, {
    x: x, y: y + 0.3, w: w, h: 0.8,
    fontSize: 42, align: 'center'
  });
  
  // 名次
  slide.addText(m.rankText, {
    x: x, y: y + 1.1, w: w, h: 0.35,
    fontSize: 15, bold: true, color: m.color,
    align: 'center'
  });
  
  // 项目
  slide.addText(m.event, {
    x: x, y: y + 1.55, w: w, h: 0.35,
    fontSize: 16, bold: true, color: COLORS.textDark,
    align: 'center'
  });
  
  // 成绩
  slide.addText(m.time, {
    x: x, y: y + 2.0, w: w, h: 0.4,
    fontSize: 20, bold: true, color: COLORS.primary,
    align: 'center'
  });
});

// 其他奖项
slide.addText('其他项目成绩', {
  x: 0.5, y: 4.3, w: 9, h: 0.3,
  fontSize: 13, bold: true, color: COLORS.textDark
});

const otherAwards = [
  { event: '100米仰泳', rank: '第4', time: '1:28.61' },
  { event: '100米自由泳', rank: '第5', time: '1:15.70' },
  { event: '50米仰泳', rank: '第6', time: '43.10' },
  { event: '50米自由泳', rank: '第6', time: '34.70' },
  { event: '200米混合泳', rank: '第7', time: '3:03.66' },
  { event: '100米蛙泳', rank: '第8', time: '1:55.19' },
  { event: '50米蛙泳', rank: '第10', time: '51.79' },
];

otherAwards.forEach((a, i) => {
  const row = Math.floor(i / 4);
  const col = i % 4;
  const x = 0.5 + col * 2.25;
  const y = 4.65 + row * 0.4;
  
  slide.addText(`${a.event}`, {
    x: x, y: y, w: 1.2, h: 0.3,
    fontSize: 10, color: COLORS.textDark,
    valign: 'middle'
  });
  slide.addText(`${a.rank}`, {
    x: x + 1.2, y: y, w: 0.5, h: 0.3,
    fontSize: 10, bold: true, color: COLORS.secondary,
    align: 'right', valign: 'middle'
  });
  slide.addText(` ${a.time}`, {
    x: x + 1.7, y: y, w: 0.5, h: 0.3,
    fontSize: 10, color: COLORS.textMuted,
    valign: 'middle'
  });
});

slide.render();

// ============================================================
// Slide 5: 成绩对比总览（表格）
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.white };

slide.addShape('rect', { x: 0, y: 0, w: 0.1, h: SLIDE_H, fill: { color: COLORS.primary } });
slide.addText('成绩对比总览', {
  x: 0.5, y: 0.3, w: 9, h: 0.5,
  fontSize: 24, bold: true, color: COLORS.primary,
  charSpacing: 1.5
});
slide.addText('各项目历史最佳成绩 vs 本次比赛成绩对比', {
  x: 0.5, y: 0.78, w: 9, h: 0.3,
  fontSize: 12, color: COLORS.textMuted
});

// 对比表格
const tableData = [
  [
    { text: '项目', options: { bold: true, color: COLORS.white, fontSize: 11, align: 'center', fill: { color: COLORS.primary } } },
    { text: '历史最佳', options: { bold: true, color: COLORS.white, fontSize: 11, align: 'center', fill: { color: COLORS.primary } } },
    { text: '上届赛事', options: { bold: true, color: COLORS.white, fontSize: 11, align: 'center', fill: { color: COLORS.primary } } },
    { text: '本次成绩', options: { bold: true, color: COLORS.white, fontSize: 11, align: 'center', fill: { color: COLORS.primary } } },
    { text: '进步', options: { bold: true, color: COLORS.white, fontSize: 11, align: 'center', fill: { color: COLORS.primary } } },
    { text: '状态', options: { bold: true, color: COLORS.white, fontSize: 11, align: 'center', fill: { color: COLORS.primary } } },
  ],
  ...[
    ['50米蝶泳', '38.96', 'U系列赛第二站', '37.01', '+1.95s', '✅ 刷新PB'],
    ['100米蝶泳', '1:28.66', 'U系列赛第二站', '1:22.61', '+6.05s', '✅ 刷新PB'],
    ['50米自由泳', '34.90', 'U系列赛第二站', '34.70', '+0.20s', '✅ 刷新PB'],
    ['100米自由泳', '1:16.71', 'U系列赛第二站', '1:15.70', '+1.01s', '✅ 刷新PB'],
    ['200米自由泳', '2:48.49', '分区赛第一站', '2:36.71', '+11.78s', '✅ 刷新PB'],
    ['200米混合泳', '3:14.97', '分区赛第一站', '3:03.66', '+11.31s', '✅ 刷新PB'],
    ['50米仰泳', '首赛', '—', '43.10', '—', '🆕 新项'],
    ['100米仰泳', '首赛', '—', '1:28.61', '—', '🆕 新项'],
    ['50米蛙泳', '首赛', '—', '51.79', '—', '🆕 新项'],
    ['100米蛙泳', '首赛', '—', '1:55.19', '—', '🆕 新项'],
  ].map((row, i) => row.map((cell, j) => ({
    text: cell,
    options: {
      fontSize: 10,
      align: j === 0 ? 'left' : 'center',
      color: j === 5 && cell.includes('刷新') ? COLORS.success : (j === 5 && cell.includes('新') ? COLORS.secondary : COLORS.textDark),
      bold: j === 3 || j === 5,
      fill: { color: i % 2 === 0 ? COLORS.offWhite : COLORS.white },
      valign: 'middle'
    }
  })))
];

slide.addTable(tableData, {
  x: 0.5, y: 1.15, w: 9, h: 3.8,
  rowH: 0.38,
  colW: [1.4, 1.2, 1.8, 1.2, 1, 1.4],
  border: { type: 'none' },
  margin: [0.05, 0.05, 0.05, 0.05]
});

// 底部统计
slide.addShape('rect', {
  x: 0.5, y: 5.0, w: 9, h: 0.45,
  fill: { color: 'ECFDF5' },
  rectRadius: 0.06
});
slide.addText('💪 参赛10项 · 刷新PB 6项 · 首次参赛4项 · 退步0项 · 进步项目累计提升32.30秒', {
  x: 0.5, y: 5.0, w: 9, h: 0.45,
  fontSize: 12, bold: true, color: COLORS.success,
  align: 'center', valign: 'middle'
});

slide.render();

// ============================================================
// Slide 6: 进步项目明细（柱状图）
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.offWhite };

slide.addShape('rect', { x: 0, y: 0, w: 0.1, h: SLIDE_H, fill: { color: COLORS.primary } });
slide.addText('进步项目明细', {
  x: 0.5, y: 0.35, w: 9, h: 0.55,
  fontSize: 26, bold: true, color: COLORS.primary,
  charSpacing: 1.5
});
slide.addText('5个项目全部刷新个人最佳，累计提升20.99秒', {
  x: 0.5, y: 0.9, w: 9, h: 0.35,
  fontSize: 13, color: COLORS.textMuted
});

// 柱状图
slide.addChart('bar', [
  {
    name: '进步幅度（秒）',
    labels: ['200米自由泳', '200米混合泳', '100米蝶泳', '50米蝶泳', '100米自由泳', '50米自由泳'],
    values: [11.78, 11.31, 6.05, 1.95, 1.01, 0.20]
  }
], {
  x: 0.5, y: 1.4, w: 5.5, h: 3.5,
  barDir: 'bar',
  barColors: [COLORS.primary, COLORS.secondary, '0EA5E9', '38BDF8', '7DD3FC', 'BAE6FD'],
  showLegend: false,
  showValue: true,
  valueFontSize: 11,
  valueFontColor: COLORS.textDark,
  catAxisLabelFontSize: 10,
  catAxisLabelColor: COLORS.textDark,
  valAxisLabelFontSize: 9,
  valAxisLabelColor: COLORS.textMuted,
  chartColors: [COLORS.primary],
  valAxisMinVal: 0,
  valAxisMaxVal: 12,
});

// 右侧亮点
slide.addImage({
  path: IMG_DIR + 'swim-training.jpg',
  x: 6.3, y: 1.4, w: 3.2, h: 2,
  mode: 'cover',
  rectRadius: 0.08
});

slide.addText('进步亮点', {
  x: 6.3, y: 3.55, w: 3.2, h: 0.35,
  fontSize: 14, bold: true, color: COLORS.primary
});

const highlights = [
  '🏆 200自进步最大，快了11.78秒',
  '🏊 200米混进步11.31秒',
  '🦋 蝶泳两项共进步8秒',
  '⚡ 6项全部刷新PB'
];

highlights.forEach((h, i) => {
  slide.addText(h, {
    x: 6.3, y: 3.95 + i * 0.35, w: 3.2, h: 0.3,
    fontSize: 11, color: COLORS.textDark
  });
});

slide.render();

// ============================================================
// Slide 7: 首次参赛项目
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.white };

slide.addShape('rect', { x: 0, y: 0, w: 0.1, h: SLIDE_H, fill: { color: COLORS.primary } });
slide.addText('首次参赛项目', {
  x: 0.5, y: 0.35, w: 9, h: 0.55,
  fontSize: 26, bold: true, color: COLORS.primary,
  charSpacing: 1.5
});
slide.addText('4个新项目首次参加正式比赛，表现可圈可点', {
  x: 0.5, y: 0.9, w: 9, h: 0.35,
  fontSize: 13, color: COLORS.textMuted
});

const newEvents = [
  { event: '100米仰泳', time: '1:28.61', rank: '第4名', desc: '首次参赛即获第四' },
  { event: '50米仰泳', time: '43.10', rank: '第6名', desc: '仰泳短距离首秀' },
  { event: '100米蛙泳', time: '1:55.19', rank: '第8名', desc: '蛙泳长距离首赛' },
  { event: '50米蛙泳', time: '51.79', rank: '第10名', desc: '蛙泳短距离首赛' },
];

newEvents.forEach((e, i) => {
  const row = Math.floor(i / 2);
  const col = i % 2;
  const x = 2.0 + col * 3.2;
  const y = 1.45 + row * 1.9;
  const w = 2.8;
  const h = 1.65;
  
  addCard(slide, x, y, w, h);
  
  // 顶部标签
  slide.addShape('rect', {
    x: x, y: y, w: w, h: 0.08,
    fill: { color: COLORS.secondary }
  });
  
  // NEW标签
  slide.addShape('rect', {
    x: x + w - 0.9, y: y + 0.15, w: 0.75, h: 0.28,
    fill: { color: 'DBEAFE' },
    rectRadius: 0.04
  });
  slide.addText('🆕 首赛', {
    x: x + w - 0.9, y: y + 0.15, w: 0.75, h: 0.28,
    fontSize: 10, bold: true, color: COLORS.primary,
    align: 'center', valign: 'middle'
  });
  
  // 项目名
  slide.addText(e.event, {
    x: x + 0.15, y: y + 0.3, w: w - 0.3, h: 0.4,
    fontSize: 15, bold: true, color: COLORS.textDark
  });
  
  // 成绩
  slide.addText(e.time, {
    x: x + 0.15, y: y + 0.72, w: w - 0.3, h: 0.4,
    fontSize: 22, bold: true, color: COLORS.primary
  });
  
  // 名次
  slide.addText(e.rank, {
    x: x + 0.15, y: y + 1.12, w: w - 0.3, h: 0.25,
    fontSize: 12, bold: true, color: COLORS.secondary
  });
  
  // 描述
  slide.addText(e.desc, {
    x: x + 0.15, y: y + 1.3, w: w - 0.3, h: 0.25,
    fontSize: 10, color: COLORS.textMuted
  });
});

slide.render();

// ============================================================
// Slide 8: 全历史成绩对比 - 蝶泳&自由泳
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.offWhite };

slide.addShape('rect', { x: 0, y: 0, w: 0.1, h: SLIDE_H, fill: { color: COLORS.primary } });
slide.addText('主项&全能成绩演变', {
  x: 0.5, y: 0.3, w: 9, h: 0.5,
  fontSize: 24, bold: true, color: COLORS.primary,
  charSpacing: 1.5
});
slide.addText('蝶泳主项 · 自由泳 · 混合泳 — 历年比赛成绩趋势', {
  x: 0.5, y: 0.78, w: 9, h: 0.3,
  fontSize: 12, color: COLORS.textMuted
});

// 蝶泳50米趋势图
slide.addChart('line', [
  {
    name: '50米蝶泳',
    labels: ['2024/08', '2024/11', '2025/07', '2026/05', '2026/08'],
    values: [44.58, 43.27, 39.17, 38.96, 37.01]
  }
], {
  x: 0.3, y: 1.15, w: 4.5, h: 2.0,
  showLegend: false,
  lineColor: COLORS.primary,
  lineWidth: 2.5,
  showMarker: true,
  markerColor: COLORS.gold,
  markerSize: 6,
  catAxisLabelFontSize: 9,
  valAxisLabelFontSize: 8,
  valAxisLabelColor: COLORS.textMuted,
  valAxisMinVal: 35,
  valAxisMaxVal: 46,
  chartColors: [COLORS.primary],
  showValue: false,
  title: '50米蝶泳 历年成绩（秒）',
  titleFontSize: 12,
  titleColor: COLORS.textDark,
  titleBold: true
});

// 100米蝶泳趋势图
slide.addChart('line', [
  {
    name: '100米蝶泳',
    labels: ['2024/08', '2024/11', '2025/07', '2026/05', '2026/08'],
    values: [104.48, 99.51, 91.93, 88.66, 82.61]
  }
], {
  x: 5.2, y: 1.15, w: 4.5, h: 2.0,
  showLegend: false,
  lineColor: COLORS.secondary,
  lineWidth: 2.5,
  showMarker: true,
  markerColor: COLORS.gold,
  markerSize: 6,
  catAxisLabelFontSize: 9,
  valAxisLabelFontSize: 8,
  valAxisLabelColor: COLORS.textMuted,
  valAxisMinVal: 80,
  valAxisMaxVal: 106,
  chartColors: [COLORS.secondary],
  showValue: false,
  title: '100米蝶泳 历年成绩（秒）',
  titleFontSize: 12,
  titleColor: COLORS.textDark,
  titleBold: true
});

// 自由泳+混合泳趋势
slide.addChart('line', [
  {
    name: '200米自由泳',
    labels: ['2025/05', '2026/06', '2026/08'],
    values: [179.52, 168.49, 156.71]
  },
  {
    name: '200米混合泳',
    labels: ['2026/06', '2026/08'],
    values: [194.97, 183.66]
  },
  {
    name: '100米自由泳',
    labels: ['2025/03', '2025/07', '2026/05', '2026/08'],
    values: [84.04, 80.29, 76.71, 75.70]
  }
], {
  x: 0.3, y: 3.3, w: 9.4, h: 2.1,
  showLegend: true,
  legendPos: 'top',
  legendFontSize: 10,
  lineWidth: 2,
  showMarker: true,
  markerSize: 5,
  catAxisLabelFontSize: 9,
  valAxisLabelFontSize: 8,
  valAxisLabelColor: COLORS.textMuted,
  chartColors: [COLORS.primary, COLORS.gold, COLORS.secondary],
  showValue: false,
  title: '200米自由泳/混合泳 + 100自历年成绩演变（秒）',
  titleFontSize: 12,
  titleColor: COLORS.textDark,
  titleBold: true,
  valAxisOrientation: 'minMax'
});

slide.render();

// ============================================================
// Slide 9: 训练效果总结
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.white };

slide.addShape('rect', { x: 0, y: 0, w: 0.1, h: SLIDE_H, fill: { color: COLORS.primary } });
slide.addText('训练效果总结', {
  x: 0.5, y: 0.35, w: 9, h: 0.55,
  fontSize: 26, bold: true, color: COLORS.primary,
  charSpacing: 1.5
});

// 左侧结论
const conclusions = [
  { icon: '🏊', title: '主项优势明显', desc: '蝶泳两个项目均获银牌，100蝶进步6.05秒，主项地位稳固' },
  { icon: '⚡', title: '自由泳全面提升', desc: '50/100/200自全部刷新PB，200自夺冠并进步11.78秒' },
  { icon: '🏅', title: '混合泳突破显著', desc: '200米混进步11.31秒，全能能力大幅提升，排名进入前八' },
  { icon: '💪', title: '体能训练见效', desc: '暑假大运动量训练效果显著，耐力项目进步幅度最大' },
];

conclusions.forEach((c, i) => {
  const y = 1.1 + i * 1.0;
  const w = 5.5;
  const h = 0.85;
  
  addCard(slide, 0.5, y, w, h);
  
  slide.addText(c.icon, {
    x: 0.7, y: y + 0.15, w: 0.6, h: 0.6,
    fontSize: 28, align: 'center', valign: 'middle'
  });
  
  slide.addText(c.title, {
    x: 1.4, y: y + 0.1, w: w - 1, h: 0.35,
    fontSize: 15, bold: true, color: COLORS.textDark
  });
  
  slide.addText(c.desc, {
    x: 1.4, y: y + 0.42, w: w - 1, h: 0.4,
    fontSize: 11, color: COLORS.textMuted
  });
});

// 右侧图片
slide.addImage({
  path: IMG_DIR + 'swim-medal.jpg',
  x: 6.3, y: 1.1, w: 3.2, h: 4.1,
  mode: 'cover',
  rectRadius: 0.1
});

slide.render();

// ============================================================
// Slide 10: 后续训练方向
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.offWhite };

slide.addShape('rect', { x: 0, y: 0, w: 0.1, h: SLIDE_H, fill: { color: COLORS.primary } });
slide.addText('后续训练方向', {
  x: 0.5, y: 0.35, w: 9, h: 0.55,
  fontSize: 26, bold: true, color: COLORS.primary,
  charSpacing: 1.5
});

const directions = [
  {
    title: '巩固主项优势',
    color: COLORS.primary,
    points: [
      '蝶泳继续精细化技术',
      '出发和转身强化训练',
      '冲击三级运动员标准'
    ]
  },
  {
    title: '强化弱项提升',
    color: COLORS.secondary,
    points: [
      '蛙泳专项技术改进',
      '仰泳速度耐力训练',
      '混合泳四式均衡发展'
    ]
  },
  {
    title: '体能持续加强',
    color: COLORS.gold,
    points: [
      '保持大运动量训练节奏',
      '陆上力量训练跟进',
      '体重控制在理想区间'
    ]
  },
];

directions.forEach((d, i) => {
  const x = 0.5 + i * 3;
  const y = 1.2;
  const w = 2.7;
  const h = 3.8;
  
  addCard(slide, x, y, w, h);
  
  // 顶部色条
  slide.addShape('rect', {
    x: x, y: y, w: w, h: 0.15,
    fill: { color: d.color }
  });
  
  // 序号
  slide.addText(`0${i + 1}`, {
    x: x + 0.2, y: y + 0.35, w: 0.6, h: 0.6,
    fontSize: 32, bold: true, color: d.color,
    charSpacing: 1
  });
  
  // 标题
  slide.addText(d.title, {
    x: x + 0.2, y: y + 1.0, w: w - 0.4, h: 0.4,
    fontSize: 16, bold: true, color: COLORS.textDark
  });
  
  slide.addShape('rect', {
    x: x + 0.2, y: y + 1.45, w: 0.5, h: 0.04,
    fill: { color: d.color }
  });
  
  // 要点
  d.points.forEach((p, j) => {
    slide.addShape('ellipse', {
      x: x + 0.25, y: y + 1.75 + j * 0.6, w: 0.12, h: 0.12,
      fill: { color: d.color }
    });
    slide.addText(p, {
      x: x + 0.45, y: y + 1.65 + j * 0.6, w: w - 0.65, h: 0.35,
      fontSize: 12, color: COLORS.textDark,
      valign: 'middle'
    });
  });
});

slide.render();

// ============================================================
// Slide 11: 结束页
// ============================================================
slide = pres.addSlide();
slide.background = { path: IMG_DIR + 'bg-closing.jpg' };

// 深色遮罩
slide.addShape('rect', {
  x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
  fill: { color: COLORS.dark, transparency: 55 }
});

slide.addText('继续努力，再创佳绩', {
  x: 0.5, y: 1.8, w: 9, h: 0.8,
  fontSize: 36, bold: true, color: COLORS.white,
  align: 'center', valign: 'middle',
  charSpacing: 2.5
});

slide.addShape('rect', {
  x: 4.5, y: 2.7, w: 1, h: 0.06,
  fill: { color: COLORS.gold }
});

slide.addText('王子期 游泳训练总结', {
  x: 0.5, y: 3.0, w: 9, h: 0.5,
  fontSize: 16, color: COLORS.light,
  align: 'center'
});

slide.addText('2026年8月', {
  x: 0.5, y: 3.6, w: 9, h: 0.4,
  fontSize: 13, color: 'CBD5E1',
  align: 'center'
});

slide.render();

// ============================================================
// 输出文件
// ============================================================
pres.writeFile({ fileName: "/workspace/training-summary/王子期游泳训练总结汇报.pptx" })
  .then(() => {
    console.log('PPT生成成功！');
  })
  .catch(err => {
    console.error('生成失败:', err);
  });
