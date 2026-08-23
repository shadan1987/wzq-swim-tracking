// 游泳成绩 + 身高体重 追踪 · 轻量后端
// 技术：Node.js 内置模块，零第三方依赖
// 运行：node server.js   （端口可用环境变量 PORT 覆盖，默认 8765）
// 功能：
//   1) 静态文件服务（托管本目录下的 swimming-comparison.html 等）
//   2) REST API 持久化身高体重 / 游泳成绩到 data/store.json
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const PORT = process.env.PORT || 8765;

// ---------------- 数据层 ----------------
function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) {
    let swimScores = [];
    // 首次运行：从 swimming_data.js 自动导入已有游泳成绩
    try {
      const raw = fs.readFileSync(path.join(ROOT, 'swimming_data.js'), 'utf8');
      const m = raw.match(/const REAL_DATA\s*=\s*(\[[\s\S]*?\])\s*;/);
      if (m) swimScores = JSON.parse(m[1]);
    } catch (e) { /* 导入失败则留空 */ }
    fs.writeFileSync(STORE_FILE, JSON.stringify({ growth: [], swimScores }, null, 2), 'utf8');
    console.log('📦 已初始化数据文件，导入游泳成绩 ' + swimScores.length + ' 条');
  }
}
function readStore() {
  try { return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')); }
  catch (e) { return { growth: [], swimScores: [] }; }
}
function writeStore(obj) {
  fs.writeFileSync(STORE_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

// ---------------- 工具 ----------------
function sendJSON(res, code, obj) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => (data += c));
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { reject(new Error('请求体不是合法 JSON')); }
    });
    req.on('error', reject);
  });
}
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ---------------- 路由 ----------------
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const p = u.pathname;

  // ===== API =====
  if (p.startsWith('/api/')) {
    try {
      // 身高体重：列表
      if (p === '/api/growth' && req.method === 'GET') {
        return sendJSON(res, 200, readStore().growth || []);
      }
      // 身高体重：新增
      if (p === '/api/growth' && req.method === 'POST') {
        const b = await readBody(req);
        const date = String(b.date || '');
        const height = Number(b.height);
        const weight = Number(b.weight);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
          return sendJSON(res, 400, { error: '日期格式应为 YYYY-MM-DD' });
        if (!height || height < 50 || height > 220)
          return sendJSON(res, 400, { error: '身高不合法（应在 50~220 cm）' });
        if (!weight || weight < 5 || weight > 150)
          return sendJSON(res, 400, { error: '体重不合法（应在 5~150 kg）' });
        const store = readStore();
        store.growth = store.growth || [];
        const rec = { id: genId(), date, height, weight };
        store.growth.push(rec);
        store.growth.sort((a, b) => (a.date < b.date ? -1 : 1));
        writeStore(store);
        return sendJSON(res, 200, store.growth);
      }
      // 身高体重：删除
      if (p === '/api/growth' && req.method === 'DELETE') {
        const id = u.searchParams.get('id');
        const store = readStore();
        store.growth = (store.growth || []).filter(r => r.id !== id);
        writeStore(store);
        return sendJSON(res, 200, store.growth);
      }
      // 游泳成绩：列表
      if (p === '/api/swimscores' && req.method === 'GET') {
        return sendJSON(res, 200, readStore().swimScores || []);
      }
      // 游泳成绩：整体替换
      if (p === '/api/swimscores' && req.method === 'POST') {
        const b = await readBody(req);
        if (!Array.isArray(b)) return sendJSON(res, 400, { error: '请求体应为数组' });
        const store = readStore();
        store.swimScores = b;
        writeStore(store);
        return sendJSON(res, 200, { count: b.length });
      }
      // 训练数据：列表
      if (p === '/api/training' && req.method === 'GET') {
        return sendJSON(res, 200, readStore().training || []);
      }
      // 训练数据：新增
      if (p === '/api/training' && req.method === 'POST') {
        const b = await readBody(req);
        const date = String(b.date || '');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
          return sendJSON(res, 400, { error: '日期格式应为 YYYY-MM-DD' });
        const store = readStore();
        store.training = store.training || [];
        const rec = {
          id: genId(),
          date: date,
          type: b.type || 'daily',       // 'daily' = 每日训练, 'test' = 测试成绩
          event: b.event || '',           // 项目（测试成绩用）
          pool: b.pool || '',             // '25米池' | '50米池'（测试成绩用）
          time: b.time || '',             // 成绩（测试成绩用）
          content: b.content || '',       // 训练内容（每日训练用）
          duration: b.duration || 0,      // 训练时长/分钟（每日训练用）
          intensity: b.intensity || '',   // 强度
          notes: b.notes || ''            // 备注
        };
        store.training.push(rec);
        store.training.sort((a, b) => (a.date < b.date ? 1 : -1));
        writeStore(store);
        return sendJSON(res, 200, store.training);
      }
      // 训练数据：删除
      if (p === '/api/training' && req.method === 'DELETE') {
        const id = u.searchParams.get('id');
        const store = readStore();
        store.training = (store.training || []).filter(r => r.id !== id);
        writeStore(store);
        return sendJSON(res, 200, store.training);
      }
      // 学习记录：列表
      if (p === '/api/study' && req.method === 'GET') {
        return sendJSON(res, 200, readStore().study || []);
      }
      // 学习记录：新增
      if (p === '/api/study' && req.method === 'POST') {
        const b = await readBody(req);
        const date = String(b.date || '');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
          return sendJSON(res, 400, { error: '日期格式应为 YYYY-MM-DD' });
        const store = readStore();
        store.study = store.study || [];
        const rec = {
          id: genId(),
          date: date,
          semester: b.semester || '',      // 学期 如 '三年级上'
          examType: b.examType || '',      // '期中' | '期末' | '测验' | '月考'
          subject: b.subject || '',        // 科目
          score: b.score || 0,             // 分数
          fullScore: b.fullScore || 100,   // 满分
          rank: b.rank || '',              // 排名/等级
          notes: b.notes || ''             // 备注
        };
        store.study.push(rec);
        store.study.sort((a, b) => (a.date < b.date ? 1 : -1));
        writeStore(store);
        return sendJSON(res, 200, store.study);
      }
      // 学习记录：删除
      if (p === '/api/study' && req.method === 'DELETE') {
        const id = u.searchParams.get('id');
        const store = readStore();
        store.study = (store.study || []).filter(r => r.id !== id);
        writeStore(store);
        return sendJSON(res, 200, store.study);
      }
      return sendJSON(res, 404, { error: '未知接口：' + req.method + ' ' + p });
    } catch (e) {
      return sendJSON(res, 500, { error: e.message });
    }
  }

  // ===== 静态文件 =====
  let rel = decodeURIComponent(p);
  if (rel === '/') rel = '/swimming-comparison.html';
  const filePath = path.join(ROOT, path.normalize(rel));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(buf);
  });
});

ensureStore();
server.listen(PORT, '127.0.0.1', () => {
  console.log('✅ 游泳追踪服务已启动： http://127.0.0.1:' + PORT + '/swimming-comparison.html');
  console.log('   身高体重数据持久化于： ' + STORE_FILE);
});
