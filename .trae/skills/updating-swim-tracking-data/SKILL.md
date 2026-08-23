---
name: updating-swim-tracking-data
description: >
  Update and manage the Wang Ziqi swimming tracking system data.
  Use when the user wants to add, modify, or query training records,
  study records, growth (height/weight) data, or swim competition scores.
  Also use when the user needs to sync seed data into the HTML file,
  start/restart the Node.js backend, or export the project as a zip.
  Do NOT use for general coding questions unrelated to this project.
---

# 王子期游泳追踪数据管理

## 描述
管理王子期游泳比赛成绩追踪系统的数据文件（`data/store.json`）和前端种子数据。支持训练记录、学习记录、身高体重、比赛成绩的增删改查，以及后端服务的启停管理。

## 使用场景
- 用户提到"更新数据"、"添加记录"、"录入成绩"、"修改身高"等数据操作
- 用户提到"运行网站"、"启动后端"、"重启服务"等服务操作
- 用户提到"打包"、"导出"、"发给我"等文件分发操作
- 用户提到"种子数据"、"内置数据"、"每次打开都有数据"等数据持久化需求

## 输入
```yaml
operation: enum    # add | update | delete | query | sync | start-server | stop-server | export-zip
dataType: enum     # training | study | growth | swimScores
records: object[]  # 新增/修改的记录数组（操作类型为 add/update 时必填）
```

## 输出
```yaml
success: boolean
message: string           # 操作结果摘要
affectedRecords: number   # 受影响的记录数
filePath: string          # 修改后的文件路径（如适用）
```

## 指令

### Step 1：解析用户意图
从用户输入中提取以下信息：
- 操作类型（新增/修改/删除/查询/同步/启动服务/打包）
- 数据类型（训练/学习/身高体重/比赛成绩）
- 具体记录内容（日期、项目、成绩、分数、身高、体重等）

日期推断规则：
- "今天" = 当前系统日期
- "昨天" = 当前系统日期 - 1 天
- "前天" = 当前系统日期 - 2 天
- "早上" = 保持日期不变，仅用于时间描述

成绩格式统一：
- "1分19秒" → `1:19.00`
- "3分09秒" → `3:09.00`
- "39秒" → `39.00`

### Step 2：定位数据文件
项目数据统一存储在 `/workspace/data/store.json`（后端模式）和 `/workspace/swimming-comparison.html` 内置种子（纯前端模式）。

两个文件必须**同步更新**，确保纯前端模式和后端模式数据一致。

### Step 3：执行数据操作

#### 新增记录（add）
1. 读取 `store.json`
2. 根据 dataType 将记录追加到对应数组
3. 为记录生成唯一 id：
   - 训练：`local_` + Date.now().toString(36) + 随机后缀
   - 学习：`local_` + Date.now().toString(36) + `_` + 学期 + `_` + 考试类型 + `_` + 科目
   - 身高体重：`g` + 两位序号（如已有 g01~g16，则新记录为 g17）
4. 按日期排序后写回 `store.json`
5. 同步更新 `swimming-comparison.html` 中的对应种子数组

#### 修改记录（update）
1. 按日期+项目/科目匹配目标记录
2. 更新字段值
3. 写回 `store.json`
4. 同步更新 `swimming-comparison.html`

#### 删除记录（delete）
1. 按 id 或日期+项目匹配目标记录
2. 从数组中过滤掉目标记录
3. 写回 `store.json`
4. 同步更新 `swimming-comparison.html`

#### 同步种子数据（sync）
1. 读取 `store.json` 中 training、study、growth 的完整数据
2. 在 `swimming-comparison.html` 中生成对应的 `TRAINING_SEED`、`STUDY_SEED`、`GROWTH_SEED` 数组
3. 替换旧的种子数组定义
4. 确保 `loadTraining()`、`loadStudy()`、`loadGrowth()` 函数在 API 和 localStorage 都为空时回退到种子数据

### Step 4：验证与反馈
操作完成后，向用户汇报：
- 成功/失败状态
- 受影响的记录明细（表格形式）
- 是否需要刷新页面或重启服务

### Step 5：后端服务管理（如需要）
- **启动服务**：`PORT=8080 node /workspace/server.js`
- **停止服务**：终止占用 8080 端口的 Node.js 进程
- **重启服务**：先停止再启动

## 失败策略
- store.json 不存在：自动创建包含空数组的初始结构
- swimming-comparison.html 中找不到种子数组：在对应位置插入新的种子定义
- 日期格式错误：提示用户修正为 `YYYY-MM-DD`
- 端口号被占用：尝试使用其他端口（如 8081）或提示用户关闭占用进程

## 数据格式规范

### 训练记录（training）
```json
{
  "id": "string",
  "date": "YYYY-MM-DD",
  "type": "daily | test",
  "event": "string",
  "pool": "25米池 | 50米池",
  "time": "M:SS.mm",
  "content": "string",
  "duration": number,
  "intensity": "string",
  "notes": "string"
}
```

### 学习记录（study）
```json
{
  "id": "string",
  "date": "YYYY-MM-DD",
  "semester": "string",
  "examType": "期中 | 期末 | 测验 | 月考",
  "subject": "string",
  "score": number,
  "fullScore": number,
  "rank": "string",
  "notes": "string"
}
```

### 身高体重（growth）
```json
{
  "id": "string",
  "date": "YYYY-MM-DD",
  "height": number,
  "weight": number
}
```
