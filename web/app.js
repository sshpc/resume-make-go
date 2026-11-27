/* 简历工具 · 前端逻辑（无构建、无依赖，除 html2canvas） */
(function () {
  'use strict';

  const TOKEN = window.__RESUME_TOKEN__ || '';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const uid = () => Math.random().toString(36).slice(2, 9);

  /* ---------------- 常量 ---------------- */
  const THEMES = {
    blue:   { name: '藏青', ac: '#2a55c7', soft: '#eef2fd', line: '#d3ddf6', deep: '#1e3f9a' },
    ink:    { name: '墨黑', ac: '#333a48', soft: '#f0f2f5', line: '#d8dce4', deep: '#20242e' },
    green:  { name: '青竹', ac: '#16785e', soft: '#e9f6f1', line: '#cfe9e0', deep: '#0f5744' },
    amber:  { name: '赤陶', ac: '#b45a1e', soft: '#fdf1e7', line: '#f1dcc8', deep: '#8a4314' },
    violet: { name: '紫藤', ac: '#6343b8', soft: '#f1edfc', line: '#ded5f7', deep: '#4a3091' },
    teal:   { name: '湖蓝', ac: '#0d7285', soft: '#e8f5f7', line: '#cbe7ec', deep: '#085263' }
  };

  // 版式（模板）：只决定栏目结构，字号行距等由「全局排版」统一控制。
  const TEMPLATES = [
    { id: 'modern',  name: '现代双栏' },
    { id: 'accent',  name: '侧栏色块' },
    { id: 'classic', name: '经典单栏' },
    { id: 'banner',  name: '顶栏色带' },
    { id: 'minimal', name: '极简' }
  ];

  // 密度预设：一键写入下面的全局排版数值，写完后仍可手动微调。
  const DENSITY = {
    compact: { name: '紧凑', fsBody: 12.2, fsHead: 13.2, lhBody: 1.52, gapSec: 11, gapItem: 7,  padT: 38, padR: 44, padB: 38, padL: 44 },
    normal:  { name: '标准', fsBody: 13,   fsHead: 14.5, lhBody: 1.7,  gapSec: 17, gapItem: 11, padT: 52, padR: 56, padB: 52, padL: 56 },
    loose:   { name: '宽松', fsBody: 13.8, fsHead: 15.5, lhBody: 1.86, gapSec: 22, gapItem: 14, padT: 62, padR: 66, padB: 62, padL: 66 }
  };
  const DENSITY_KEYS = ['fsBody', 'fsHead', 'lhBody', 'gapSec', 'gapItem', 'padT', 'padR', 'padB', 'padL'];

  // 无序列表的项目符号样式（导出 HTML / 编辑区共用）
  const BULLETS = [
    { id: 'diamond', name: '小方块' },
    { id: 'disc',    name: '小黑点' },
    { id: 'circle',  name: '小圆圈' },
    { id: 'none',    name: '不显示' }
  ];

  // 基本信息里可配置的字段：默认名称、是否显示。
  const META_FIELDS = [
    { key: 'phone',   label: '手机' },
    { key: 'email',   label: '邮箱' },
    { key: 'city',    label: '城市' },
    { key: 'gender',  label: '性别' },
    { key: 'birth',   label: '出生年月' },
    { key: 'years',   label: '工作年限' },
    { key: 'website', label: '个人主页' }
  ];

  const COLONS = ['', '：', ':'];

  const SEC_TYPES = {
    experience: { name: '工作经历', kind: 'items', role: '公司 / 组织', title: '职位名称', add: '新增一段经历' },
    project:    { name: '项目经历', kind: 'items', role: '项目名称',   title: '担任角色', add: '新增一个项目' },
    education:  { name: '教育背景', kind: 'items', role: '学校名称',   title: '专业 / 学历', add: '新增一段学历' },
    skills:     { name: '技能标签', kind: 'tags' },
    custom:     { name: '自定义模块', kind: 'text' }
  };

  /* ---------------- 默认数据 ---------------- */
  function defaultLayout() {
    const d = DENSITY.normal;
    return {
      fsBody: d.fsBody, fsHead: d.fsHead, lhBody: d.lhBody,
      gapSec: d.gapSec, gapItem: d.gapItem,
      padT: d.padT, padR: d.padR, padB: d.padB, padL: d.padL,
      bullet: 'diamond',
      colon: '：',
      showLabel: true,
      sideLeft: false
    };
  }

  function defaultMetaFields() {
    return META_FIELDS.map((f) => ({ key: f.key, label: f.label, show: true }));
  }

  function defaultResume() {
    return {
      meta: {
        name: '张明远',
        job: '高级前端工程师',
        phone: '138-0000-0000',
        email: 'zhangmingyuan@example.com',
        city: '杭州',
        gender: '男',
        birth: '1994.05',
        years: '6 年经验',
        website: 'github.com/zhangmy',
        avatar: ''
      },
      metaFields: defaultMetaFields(),
      theme: { color: 'blue', template: 'modern' },
      layout: defaultLayout(),
      sections: [
        {
          id: uid(), type: 'experience', title: '工作经历', col: 'main',
          items: [
            {
              id: uid(), role: '杭州云启科技有限公司', title: '高级前端工程师', start: '2021.03', end: '至今',
              desc: '<ul><li>负责企业级低代码平台前端架构，主导<b>渲染引擎重构</b>，首屏加载耗时从 3.4s 降至 <b>1.1s</b></li><li>搭建组件库与可视化编辑器，支撑 12 条业务线复用，节省重复开发约 40%</li><li>推动前端工程化落地，接入单元测试与灰度发布，线上故障率<i>下降 65%</i></li></ul>'
            },
            {
              id: uid(), role: '上海微光网络科技', title: '前端工程师', start: '2018.07', end: '2021.02',
              desc: '<ul><li>完成电商中台从 jQuery 到 Vue 的技术迁移，覆盖 30+ 页面模块</li><li>优化商品详情页渲染策略，转化率提升 8.6%</li><li>负责移动端 H5 性能治理，弱网首屏可用时间缩短至 1.8s</li></ul>'
            }
          ]
        },
        {
          id: uid(), type: 'project', title: '项目经历', col: 'main',
          items: [
            {
              id: uid(), role: '低代码可视化搭建平台', title: '前端负责人', start: '2022.04', end: '2023.12',
              desc: '<ul><li>设计拖拽画布与 schema 协议，支持 60+ 物料与嵌套布局</li><li>实现运行时渲染引擎，页面产出效率提升约 <b>3 倍</b></li><li>沉淀性能监控与错误上报体系，问题定位时间从小时级缩短到分钟级</li></ul>'
            }
          ]
        },
        {
          id: uid(), type: 'education', title: '教育背景', col: 'side',
          items: [
            { id: uid(), role: '浙江大学', title: '计算机科学与技术 · 本科', start: '2014.09', end: '2018.06', desc: '<p>GPA 3.7 / 4.0，校级优秀毕业生</p>' }
          ]
        },
        {
          id: uid(), type: 'skills', title: '专业技能', col: 'side',
          tags: 'JavaScript, TypeScript, Vue 3, React, Node.js, Vite, Webpack, 性能优化, 可视化, 工程化'
        },
        {
          id: uid(), type: 'custom', title: '自我评价', col: 'side',
          text: '六年一线前端经验，擅长复杂业务抽象与性能治理。习惯用数据衡量效果，能独立推动跨团队协作落地。'
        }
      ]
    };
  }

  /* ---------------- 状态 ---------------- */
  let state = defaultResume();
  let dirty = false;
  let saving = false;
  let pendingSave = false;
  let failCount = 0;
  let saveTimer = null;
  let zoom = 1;
  let fitMode = false;
  const openCards = new Set();

  /* ---------------- 路径读写 ---------------- */
  function setPath(root, path, val) {
    const keys = path.split('.');
    let cur = root;
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
    cur[keys[keys.length - 1]] = val;
  }
  function getPath(root, path) {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), root);
  }

  /* ---------------- 提示 ---------------- */
  let toastTimer = null;
  function toast(msg, isErr) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.toggle('err', !!isErr);
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), isErr ? 5200 : 2800);
  }
  const loading = (on, text) => {
    const el = $('#loading');
    if (text) el.querySelector('span').textContent = text;
    el.classList.toggle('show', !!on);
  };

  /* ---------------- 服务端交互 ---------------- */
  async function api(path, body) {
    const opt = { method: body === undefined ? 'GET' : 'POST', headers: { 'X-Resume-Token': TOKEN } };
    if (body !== undefined) {
      opt.headers['Content-Type'] = 'application/json';
      opt.body = JSON.stringify(body);
    }
    const res = await fetch(path, opt);
    let json = null;
    try { json = await res.json(); } catch (e) { /* ignore */ }
    if (!res.ok || !json || json.ok === false) {
      throw new Error((json && json.error) || ('请求失败（' + res.status + '）'));
    }
    return json;
  }

  function markDirty() {
    dirty = true;
    updateSaveState();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 900);
  }

  function updateSaveState(txt) {
    const el = $('#saveState');
    if (txt) { el.textContent = txt; return; }
    if (saving) el.textContent = '正在保存…';
    else if (dirty) el.textContent = '有未保存的修改';
    else el.textContent = '已自动保存';
  }

  async function save(silent) {
    // 已经有一次保存在飞：记下来，等它结束后再补一次，避免丢掉最后一次修改。
    if (saving) { pendingSave = true; return true; }
    saving = true;
    updateSaveState();
    // 记下这次真正提交出去的内容，回来后据此判断期间是否有新修改。
    let snapshot = '';
    try { snapshot = JSON.stringify(state); } catch (e) { /* ignore */ }
    let ok = true;
    try {
      await api('/api/resume', state);
      failCount = 0;
      // 只有在「提交的内容 == 当前内容」时才算干净；期间改过就仍是脏的。
      let now = '';
      try { now = JSON.stringify(state); } catch (e) { now = snapshot; }
      dirty = now !== snapshot;
      if (!silent && !dirty) {
        updateSaveState('已保存 ' + new Date().toLocaleTimeString('zh-CN', { hour12: false }));
      } else {
        updateSaveState();
      }
    } catch (e) {
      ok = false;
      dirty = true;
      failCount++;
      updateSaveState('保存失败：' + e.message);
      if (!silent) toast('保存失败：' + e.message, true);
    } finally {
      saving = false;
      if (pendingSave || dirty) {
        pendingSave = false;
        clearTimeout(saveTimer);
        // 连续失败时退避重试，避免服务异常时每 800ms 打一次请求。
        const wait = failCount ? Math.min(30000, 1500 * Math.pow(2, Math.min(failCount - 1, 4))) : 800;
        saveTimer = setTimeout(() => save(true), wait);
      }
    }
    return ok;
  }

  /* ---------------- 富文本 ---------------- */
  // 只允许这些标签，且一律去掉属性（含 style / on* ），
  // 因为 desc 可能是导入的 JSON 或粘贴进来的 HTML。
  const RICH_TAGS = /^(b|strong|i|em|u|br|p|div|ul|ol|li)$/i;

  function sanitizeHtml(html) {
    let s = String(html == null ? '' : html);
    s = s.replace(/<!--[\s\S]*?-->/g, '');
    s = s.replace(/<(script|style|iframe|object|embed|link|meta|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
    s = s.replace(/<(script|style|iframe|object|embed|link|meta|svg|math)\b[^>]*\/?>/gi, '');
    s = s.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g, (m0, tag) => {
      if (!RICH_TAGS.test(tag)) return '';
      const t = tag.toLowerCase();
      if (t === 'br') return '<br>';
      return m0.charAt(1) === '/' ? '</' + t + '>' : '<' + t + '>';
    });
    s = s.replace(/javascript:/gi, '');
    return s;
  }

  // 兼容旧版本存档：desc 曾经是「每行一条」的纯文本。
  function descToHtml(v) {
    const s = String(v == null ? '' : v);
    if (!s.trim()) return '';
    if (/<[a-zA-Z]/.test(s)) return sanitizeHtml(s);
    const lines = s.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    if (!lines.length) return '';
    if (lines.length === 1) return '<p>' + esc(lines[0]) + '</p>';
    return '<ul>' + lines.map((l) => '<li>' + esc(l) + '</li>').join('') + '</ul>';
  }

  /* ---------------- 编辑器渲染 ---------------- */
  function secIndex(id) { return state.sections.findIndex((s) => s.id === id); }

  function metaFieldsOf() {
    if (!Array.isArray(state.metaFields) || !state.metaFields.length) state.metaFields = defaultMetaFields();
    return state.metaFields;
  }

  function numField(label, key, min, max, step) {
    const v = state.layout[key];
    return `<div class="num-item"><label>${label}</label>
      <input type="number" data-layout="${key}" value="${v}" min="${min}" max="${max}" step="${step || 0.5}"></div>`;
  }

  function richTools(path) {
    return `<div class="rich-tools" data-rt-for="${path}">
      <button type="button" class="rich-btn" data-rt="bold" title="加粗（Ctrl+B）"><b>B</b></button>
      <button type="button" class="rich-btn" data-rt="italic" title="斜体（Ctrl+I）"><i>I</i></button>
      <button type="button" class="rich-btn" data-rt="underline" title="下划线（Ctrl+U）"><u>U</u></button>
      <span class="sep"></span>
      <button type="button" class="rich-btn" data-rt="ul" title="无序列表">•&nbsp;列表</button>
      <button type="button" class="rich-btn" data-rt="ol" title="有序列表">1.&nbsp;列表</button>
      <span class="tip-txt">回车换行，列表自动加符号</span>
    </div>`;
  }

  function renderEditor() {
    const box = $('#editor');
    const scrollTop = box.scrollTop;
    let html = '';

    /* 基本信息 */
    const open = openCards.has('__meta');
    html += `<div class="blk ${open ? 'open' : ''}" data-card="__meta">
      <div class="blk-head" data-toggle="__meta">
        <span class="t"><span class="idx">1</span>基本信息</span>
        <span class="caret"></span>
      </div>
      <div class="blk-body">
        <div class="row">
          <div class="field"><label>姓名</label>
            <input type="text" data-bind="meta.name" value="${esc(state.meta.name)}" placeholder="你的名字"></div>
          <div class="field"><label>求职意向</label>
            <input type="text" data-bind="meta.job" value="${esc(state.meta.job)}" placeholder="如：前端工程师"></div>
        </div>
        <div class="row">
          <div class="field"><label>手机</label>
            <input type="text" data-bind="meta.phone" value="${esc(state.meta.phone)}" placeholder="138-0000-0000"></div>
          <div class="field"><label>邮箱</label>
            <input type="text" data-bind="meta.email" value="${esc(state.meta.email)}" placeholder="you@example.com"></div>
        </div>
        <div class="row">
          <div class="field"><label>城市</label>
            <input type="text" data-bind="meta.city" value="${esc(state.meta.city)}" placeholder="杭州"></div>
          <div class="field"><label>性别</label>
            <input type="text" data-bind="meta.gender" value="${esc(state.meta.gender)}" placeholder="男 / 女"></div>
        </div>
        <div class="row">
          <div class="field"><label>出生年月</label>
            <input type="text" data-bind="meta.birth" value="${esc(state.meta.birth)}" placeholder="1994.05"></div>
          <div class="field"><label>工作年限</label>
            <input type="text" data-bind="meta.years" value="${esc(state.meta.years)}" placeholder="6 年经验"></div>
        </div>
        <div class="field"><label>个人主页 <span class="hint">（可留空）</span></label>
          <input type="text" data-bind="meta.website" value="${esc(state.meta.website)}" placeholder="github.com/xxx"></div>
        <div class="field"><label>头像</label>
          <div class="add-row" style="margin-top:0">
            <button class="chip-btn" data-act="pick-avatar">选择图片…</button>
            <button class="chip-btn solid" data-act="save-avatar">保存头像文件</button>
            <button class="chip-btn solid" data-act="clear-avatar">清除</button>
          </div>
        </div>

        <div class="opt-h">字段名与显示 <span class="hint">（勾选才显示在简历上，名称可改）</span></div>
        ${metaFieldsOf().map((f, k) => `<div class="mf-row">
          <label class="mf-chk"><input type="checkbox" data-mf-show="${k}" ${f.show ? 'checked' : ''}><span></span></label>
          <input type="text" class="mf-label" data-mf-label="${k}" value="${esc(f.label)}" placeholder="字段名">
          <span class="mf-val">${esc(state.meta[f.key] || '')}</span>
        </div>`).join('')}
        <div class="mf-row" style="margin-top:8px">
          <span class="mf-label" style="color:var(--ink-2);font-size:12px">名称后的冒号</span>
          <select data-colon style="flex:1">
            <option value="" ${state.layout.colon === '' ? 'selected' : ''}>不显示</option>
            <option value="：" ${state.layout.colon === '：' ? 'selected' : ''}>全角（：）</option>
            <option value=":" ${state.layout.colon === ':' ? 'selected' : ''}>半角（:）</option>
          </select>
        </div>
      </div>
    </div>`;

    /* 全局排版 */
    const lo = openCards.has('__layout');
    html += `<div class="blk ${lo ? 'open' : ''}" data-card="__layout">
      <div class="blk-head" data-toggle="__layout">
        <span class="t"><span class="idx">2</span>排版与页面</span>
        <span class="caret"></span>
      </div>
      <div class="blk-body">
        <div class="num-grid">
          ${numField('正文字号', 'fsBody', 9, 20, 0.1)}
          ${numField('标题字号', 'fsHead', 10, 26, 0.1)}
          ${numField('行间距', 'lhBody', 1.2, 2.6, 0.02)}
          ${numField('模块间距', 'gapSec', 0, 60, 1)}
          ${numField('条目间距', 'gapItem', 0, 40, 1)}
        </div>
        <div class="opt-h">纸张边距（px）</div>
        <div class="num-grid">
          ${numField('上', 'padT', 0, 140, 1)}
          ${numField('右', 'padR', 0, 140, 1)}
          ${numField('下', 'padB', 0, 140, 1)}
          ${numField('左', 'padL', 0, 140, 1)}
        </div>
        <div class="opt-h">项目符号</div>
        <select data-bul>
          ${BULLETS.map((b) => `<option value="${b.id}" ${state.layout.bullet === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
        </select>
        <label class="tog"><input type="checkbox" data-side ${state.layout.sideLeft ? 'checked' : ''}>辅栏放左侧（双栏版式）</label>
        <label class="tog"><input type="checkbox" data-meta-label ${state.layout.showLabel ? 'checked' : ''}>基本信息显示字段名</label>
      </div>
    </div>`;

    /* 模块 */
    state.sections.forEach((s, i) => {
      const t = SEC_TYPES[s.type] || SEC_TYPES.custom;
      const isOpen = openCards.has(s.id);
      html += `<div class="blk ${isOpen ? 'open' : ''}" data-card="${s.id}">
        <div class="blk-head" data-toggle="${s.id}">
          <span class="t"><span class="idx">${i + 3}</span>${esc(s.title || t.name)}</span>
          <div class="tools" data-tools="${s.id}">
            <button class="icon-btn" data-sec-act="up" title="上移">↑</button>
            <button class="icon-btn" data-sec-act="down" title="下移">↓</button>
            <button class="icon-btn danger" data-sec-act="del" title="删除模块">✕</button>
          </div>
          <span class="caret"></span>
        </div>
        <div class="blk-body">`;

      html += `<div class="row">
          <div class="field"><label>模块标题</label>
            <input type="text" data-bind="sections.${i}.title" value="${esc(s.title)}"></div>
          <div class="field" style="flex:0 0 132px"><label>位置</label>
            <select data-bind="sections.${i}.col">
              <option value="main" ${s.col === 'main' ? 'selected' : ''}>主栏</option>
              <option value="side" ${s.col === 'side' ? 'selected' : ''}>辅栏</option>
            </select></div>
        </div>`;

      if (t.kind === 'items') {
        if (!s.items.length) html += `<div class="empty">还没有内容，点下面的按钮添加</div>`;
        s.items.forEach((it, j) => {
          const path = `sections.${i}.items.${j}.desc`;
          html += `<div class="sub">
            <div class="sub-head">
              <span class="ttl">${esc(it.role || it.title || '未命名条目')}</span>
              <button class="icon-btn" data-item-act="up" data-s="${s.id}" data-i="${j}" title="上移">↑</button>
              <button class="icon-btn" data-item-act="down" data-s="${s.id}" data-i="${j}" title="下移">↓</button>
              <button class="icon-btn danger" data-item-act="del" data-s="${s.id}" data-i="${j}" title="删除">✕</button>
            </div>
            <div class="row">
              <div class="field"><label>${t.role}</label>
                <input type="text" data-bind="sections.${i}.items.${j}.role" value="${esc(it.role)}"></div>
              <div class="field"><label>${t.title}</label>
                <input type="text" data-bind="sections.${i}.items.${j}.title" value="${esc(it.title)}"></div>
            </div>
            <div class="row">
              <div class="field"><label>开始</label>
                <input type="text" data-bind="sections.${i}.items.${j}.start" value="${esc(it.start)}" placeholder="2021.03"></div>
              <div class="field"><label>结束</label>
                <input type="text" data-bind="sections.${i}.items.${j}.end" value="${esc(it.end)}" placeholder="至今"></div>
            </div>
            <div class="field"><label>描述 <span class="hint">（加粗 / 斜体 / 下划线 / 列表）</span></label>
              <div class="rich-wrap">
                ${richTools(path)}
                <div class="rich-edit" contenteditable="true" spellcheck="false"
                  data-rich="${path}" data-ph="写点什么…">${descToHtml(it.desc)}</div>
              </div>
            </div>
          </div>`;
        });
        html += `<div class="add-row"><button class="chip-btn" data-add-item="${s.id}">+ ${t.add}</button></div>`;
      } else if (t.kind === 'tags') {
        html += `<div class="field"><label>技能标签 <span class="hint">（用逗号或换行分隔）</span></label>
          <textarea rows="3" data-bind="sections.${i}.tags" placeholder="Vue, React, Node.js">${esc(s.tags || '')}</textarea></div>`;
      } else {
        html += `<div class="field"><label>内容 <span class="hint">（支持换行）</span></label>
          <textarea rows="4" data-bind="sections.${i}.text" placeholder="写点什么…">${esc(s.text || '')}</textarea></div>`;
      }

      html += `</div></div>`;
    });

    html += `<div class="blk" style="background:#fbfcfe">
      <div class="blk-body" style="padding:12px">
        <div style="font-size:12.5px;color:var(--ink-3);margin-bottom:8px">添加模块</div>
        <div class="add-row" style="margin-top:0">
          <button class="chip-btn" data-add-sec="experience">+ 工作经历</button>
          <button class="chip-btn" data-add-sec="project">+ 项目经历</button>
          <button class="chip-btn" data-add-sec="education">+ 教育背景</button>
          <button class="chip-btn" data-add-sec="skills">+ 技能标签</button>
          <button class="chip-btn" data-add-sec="custom">+ 自定义文本</button>
        </div>
      </div>
    </div>`;

    box.innerHTML = html;
    box.scrollTop = scrollTop;
    renderBar();
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------------- 顶部工具条（版式 / 配色 / 密度） ---------------- */
  function renderBar() {
    $('#templateGroup').innerHTML = '<span class="lbl">版式</span>' + TEMPLATES.map((t) =>
      `<button class="mini ${state.theme.template === t.id ? 'on' : ''}" data-tpl="${t.id}">${t.name}</button>`
    ).join('');

    $('#themeGroup').innerHTML = '<span class="lbl">配色</span>' + Object.keys(THEMES).map((k) =>
      `<button class="swatch ${state.theme.color === k ? 'on' : ''}" data-color="${k}"
        title="${THEMES[k].name}" style="background:${THEMES[k].ac}"></button>`
    ).join('');

    const cur = currentDensity();
    $('#densityGroup').innerHTML = '<span class="lbl">密度</span>' + Object.keys(DENSITY).map((k) =>
      `<button class="mini ${cur === k ? 'on' : ''}" data-density="${k}" title="一键套用「${DENSITY[k].name}」的字号与间距">${DENSITY[k].name}</button>`
    ).join('');

    $('#zoomVal').textContent = Math.round(zoom * 100) + '%';
  }

  // 当前排版数值与哪个预设完全一致（不一致就都不高亮）。
  function currentDensity() {
    for (const k of Object.keys(DENSITY)) {
      const d = DENSITY[k];
      if (DENSITY_KEYS.every((n) => Math.abs(Number(state.layout[n]) - d[n]) < 0.001)) return k;
    }
    return '';
  }

  /* ---------------- 预览渲染 ---------------- */
  function applyTheme() {
    const t = THEMES[state.theme.color] || THEMES.blue;
    const L = state.layout;
    const page = $('#page');
    page.style.setProperty('--ac', t.ac);
    page.style.setProperty('--ac-soft', t.soft);
    page.style.setProperty('--ac-line', t.line);
    page.style.setProperty('--ac-deep', t.deep);
    page.style.setProperty('--fs-body', L.fsBody + 'px');
    page.style.setProperty('--fs-head', L.fsHead + 'px');
    page.style.setProperty('--lh-body', String(L.lhBody));
    page.style.setProperty('--gap-sec', L.gapSec + 'px');
    page.style.setProperty('--gap-item', L.gapItem + 'px');
    page.style.setProperty('--pad-t', L.padT + 'px');
    page.style.setProperty('--pad-r', L.padR + 'px');
    page.style.setProperty('--pad-b', L.padB + 'px');
    page.style.setProperty('--pad-l', L.padL + 'px');
    page.setAttribute('data-bul', L.bullet);
    page.className = 'page tpl-' + state.theme.template;
  }

  function metaItems() {
    const colon = state.layout.showLabel ? state.layout.colon : '';
    return metaFieldsOf().filter((f) => {
      const v = state.meta[f.key];
      return f.show && v != null && String(v).trim();
    }).map((f) => ({
      label: state.layout.showLabel ? f.label : '',
      colon: colon,
      value: String(state.meta[f.key]).trim()
    }));
  }

  function renderSection(s) {
    const t = SEC_TYPES[s.type] || SEC_TYPES.custom;
    let body = '';

    if (t.kind === 'items') {
      body = s.items.filter(itemHasContent).map((it) => {
        const rich = descToHtml(it.desc);
        return `<div class="item">
          <div class="item-top">
            <span class="org">${esc(it.role)}</span>
            ${it.role && it.title ? '<span class="pin"></span>' : ''}
            <span class="role">${esc(it.title)}</span>
            ${it.start || it.end ? `<span class="pin"></span><span class="date">${esc(it.start)}${it.start && it.end ? ' — ' : ''}${esc(it.end)}</span>` : ''}
          </div>
          ${rich ? `<div class="rich">${rich}</div>` : ''}
        </div>`;
      }).join('');
    } else if (t.kind === 'tags') {
      const tags = String(s.tags || '').split(/[,，\n]/).map((x) => x.trim()).filter(Boolean);
      body = `<div class="tags">${tags.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>`;
    } else {
      const paras = String(s.text || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      body = `<div class="plain">${paras.map((p) => `<p>${esc(p)}</p>`).join('')}</div>`;
    }

    if (!body) return '';
    return `<section class="sec">
      <div class="sec-h"><span class="bar"></span><h2>${esc(s.title || t.name)}</h2><span class="rule"></span></div>
      ${body}
    </section>`;
  }

  // 判断条目是否有内容。desc 是富文本 HTML，必须先剥掉标签再看有没有文字，
  // 否则只有空 <ul><li></li></ul> 的条目也会被渲染出来。
  function itemHasContent(it) {
    return ['role', 'title', 'desc'].some((k) => String(it[k] || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim());
  }

  function isTwoCol() {
    return state.theme.template === 'modern' || state.theme.template === 'accent';
  }

  function renderPage() {
    applyTheme();
    const m = state.meta;
    const page = $('#page');

    const avatarInner = m.avatar
      ? `<img src="${esc(m.avatar)}" alt="头像">`
      : `<span class="ph">${esc((m.name || '简').slice(0, 1))}</span>`;

    const head = `<div class="rhead">
      <div class="avatar" id="previewAvatar" title="点击更换头像">
        ${avatarInner}
        <span class="tip">
          <button class="av-btn" data-av="pick" title="更换头像">换</button>
          <button class="av-btn" data-av="save" title="把这张头像另存为图片">存图</button>
        </span>
      </div>
      <div class="rhead-info">
        <h1>${esc(m.name || '你的名字')}</h1>
        ${m.job ? `<div class="job">${esc(m.job)}</div>` : ''}
        ${metaItems().length ? `<div class="meta">${metaItems().map((x) =>
          `<span><i></i>${x.label ? `<span class="k">${esc(x.label)}</span>${esc(x.colon)}` : ''}${esc(x.value)}</span>`
        ).join('')}</div>` : ''}
      </div>
    </div>`;

    let bodyHtml;
    if (isTwoCol()) {
      const mains = state.sections.filter((s) => s.col !== 'side');
      const sides = state.sections.filter((s) => s.col === 'side');
      const cls = 'rbody' + (state.layout.sideLeft ? ' side-left' : '');
      bodyHtml = `<div class="${cls}">
        <div class="rcol-main">${mains.map(renderSection).join('')}</div>
        ${sides.length ? `<div class="rcol-side">${sides.map(renderSection).join('')}</div>` : ''}
      </div>`;
    } else {
      bodyHtml = `<div class="rbody">${state.sections.map(renderSection).join('')}</div>`;
    }

    page.innerHTML = head + bodyHtml;

    const av = $('#previewAvatar');
    if (av) {
      av.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-av]');
        if (btn) {
          e.stopPropagation();
          if (btn.dataset.av === 'save') exportAvatar();
          else $('#fileAvatar').click();
          return;
        }
        $('#fileAvatar').click();
      });
    }

    fitPage();
  }

  /* ---------------- 缩放 ---------------- */
  // transform 只做视觉变换、不改变布局盒，所以缩放后必须同步把外层容器的
  // 尺寸改成「缩放后的尺寸」，否则 zoom<1 会留下多余的横向滚动条、
  // zoom>1 时左侧溢出的部分无法滚动到。
  function fitPage() {
    const stage = $('#stageScroll');
    const wrap = $('#paperWrap');
    if (fitMode) {
      const avail = stage.clientWidth - 56;
      zoom = Math.min(1, Math.max(0.35, avail / 794));
    }
    const pageEl = $('#page');
    const w = pageEl.offsetWidth || 794;
    const h = pageEl.offsetHeight || 1123;
    wrap.style.transformOrigin = 'top left';
    wrap.style.transform = 'scale(' + zoom + ')';
    wrap.style.width = w * zoom + 'px';
    wrap.style.height = h * zoom + 'px';
    renderGuides(h);
    $('#zoomVal').textContent = Math.round(zoom * 100) + '%';
  }

  function setZoom(z) {
    fitMode = false;
    zoom = Math.min(2, Math.max(0.3, Math.round(z * 20) / 20));
    fitPage();
  }

  // A4 在 794px 宽度下的纸面高度（794 * 841.89 / 595.28 ≈ 1123）。
  // 每满一页画一条虚线，和导出时的切片位置一致，方便判断内容会不会跨页。
  const PAGE_H = 1123;

  function renderGuides(h) {
    const box = $('#pgGuides');
    if (!box) return;
    const pages = Math.max(1, Math.ceil((h || PAGE_H) / PAGE_H));
    if (pages < 2) { box.innerHTML = ''; return; }
    let html = '';
    for (let i = 1; i < pages; i++) {
      html += `<div class="pg-guide" style="top:${i * PAGE_H}px"><span>第 ${i + 1} 页</span></div>`;
    }
    box.innerHTML = html;
  }

  /* ---------------- 事件：编辑器 ---------------- */
  function bindEditor() {
    const box = $('#editor');

    box.addEventListener('input', (e) => {
      const el = e.target;

      // 全局排版数值
      const lay = el.dataset.layout;
      if (lay) {
        const raw = parseFloat(el.value);
        if (!isFinite(raw)) return;
        const v = clampLayout(lay, raw);
        state.layout[lay] = v;
        // 超出允许区间时把输入框纠正回来，避免显示值与实际生效值不一致
        if (v !== raw) el.value = v;
        markDirty();
        renderBar();       // 密度高亮可能变化
        schedulePreview();
        return;
      }

      // 字段名（可改名）
      const mfl = el.dataset.mfLabel;
      if (mfl !== undefined) {
        metaFieldsOf()[+mfl].label = el.value;
        markDirty();
        schedulePreview();
        return;
      }

      // 富文本描述
      const rich = el.dataset.rich;
      if (rich) {
        setPath(state, rich, el.innerHTML);
        markDirty();
        schedulePreview();
        return;
      }

      const path = el.dataset.bind;
      if (!path) return;
      setPath(state, path, el.value);
      // 「字段名与显示」那一排里的当前值是静态快照，改上面的输入框时顺手刷新它，
      // 否则用户会看到名字改了、后面的示例值还是旧的。
      const mk = /^meta\.([a-zA-Z]+)$/.exec(path);
      if (mk) {
        const k = metaFieldsOf().findIndex((f) => f.key === mk[1]);
        if (k >= 0) {
          const cell = box.querySelector(`[data-mf-label="${k}"]`);
          const row = cell && cell.parentElement;
          const val = row && row.querySelector('.mf-val');
          if (val) val.textContent = el.value;
        }
      }
      markDirty();
      schedulePreview();
      // 同步折叠面板上的标题文字（只针对模块标题，不碰条目里的「职位」字段）
      if (/^sections\.\d+\.title$/.test(path)) {
        const i = +path.split('.')[1];
        const sec = state.sections[i];
        if (sec) {
          const head = box.querySelector(`[data-card="${sec.id}"] .blk-head .t`);
          if (head) {
            const t = SEC_TYPES[sec.type] || SEC_TYPES.custom;
            head.innerHTML = `<span class="idx">${i + 3}</span>${esc(sec.title || t.name)}`;
          }
        }
      }
    });

    // 复选框 / 下拉框
    box.addEventListener('change', (e) => {
      const el = e.target;

      if (el.dataset.mfShow !== undefined) {
        metaFieldsOf()[+el.dataset.mfShow].show = !!el.checked;
        markDirty(); schedulePreview();
        return;
      }
      if (el.hasAttribute('data-colon')) {
        state.layout.colon = COLONS.indexOf(el.value) >= 0 ? el.value : '：';
        markDirty(); schedulePreview();
        return;
      }
      if (el.hasAttribute('data-bul')) {
        state.layout.bullet = BULLETS.some((b) => b.id === el.value) ? el.value : 'diamond';
        markDirty(); schedulePreview();
        return;
      }
      if (el.hasAttribute('data-side')) {
        state.layout.sideLeft = !!el.checked;
        markDirty(); schedulePreview();
        return;
      }
      if (el.hasAttribute('data-meta-label')) {
        state.layout.showLabel = !!el.checked;
        markDirty(); schedulePreview();
        return;
      }
      // 模块位置（主栏 / 辅栏）
      if (el.dataset.bind && /\.col$/.test(el.dataset.bind)) {
        setPath(state, el.dataset.bind, el.value === 'side' ? 'side' : 'main');
        markDirty(); schedulePreview();
      }
    });

    // 富文本工具条：必须拦掉 mousedown，否则按钮抢走焦点、选区丢失。
    box.addEventListener('mousedown', (e) => {
      const btn = e.target.closest('[data-rt]');
      if (!btn) return;
      e.preventDefault();
      const wrapEl = btn.closest('.rich-wrap');
      const ed = wrapEl && wrapEl.querySelector('.rich-edit');
      if (!ed) return;
      if (ed.focus) ed.focus();
      const map = {
        bold: 'bold', italic: 'italic', underline: 'underline',
        ul: 'insertUnorderedList', ol: 'insertOrderedList'
      };
      const cmd = map[btn.dataset.rt];
      try {
        if (cmd && document.execCommand) document.execCommand(cmd, false, null);
      } catch (err) { /* 老浏览器不支持就算了 */ }
      const path = ed.dataset.rich;
      if (path) {
        setPath(state, path, ed.innerHTML);
        markDirty();
        schedulePreview();
      }
    });

    // 粘贴：只接受纯文本，多行自动转成无序列表，避免把外部样式带进来。
    box.addEventListener('paste', (e) => {
      const ed = e.target.closest && e.target.closest('[data-rich]');
      if (!ed) return;
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData || {}).getData
        ? (e.clipboardData || window.clipboardData).getData('text/plain')
        : '';
      if (!text) return;
      const lines = String(text).split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      if (!lines.length) return;
      const html = lines.length === 1
        ? esc(lines[0])
        : '<ul>' + lines.map((l) => '<li>' + esc(l) + '</li>').join('') + '</ul>';
      try {
        if (document.execCommand) document.execCommand('insertHTML', false, html);
      } catch (err) { /* ignore */ }
      const path = ed.dataset.rich;
      if (path) {
        setPath(state, path, ed.innerHTML);
        markDirty();
        schedulePreview();
      }
    });

    box.addEventListener('click', (e) => {
      // 顺序很重要：模块/条目的操作按钮位于 .blk-head 内部，
      // 必须先于 [data-toggle] 判断，否则点击会被当成折叠面板而提前 return。
      const secAct = e.target.closest('[data-sec-act]');
      if (secAct) {
        e.stopPropagation();
        moveSection(secAct.closest('.blk').dataset.card, secAct.dataset.secAct);
        return;
      }
      const itemAct = e.target.closest('[data-item-act]');
      if (itemAct) {
        e.stopPropagation();
        moveItem(itemAct.dataset.s, +itemAct.dataset.i, itemAct.dataset.itemAct);
        return;
      }
      const addSec = e.target.closest('[data-add-sec]');
      if (addSec) { addSection(addSec.dataset.addSec); return; }
      const addItem = e.target.closest('[data-add-item]');
      if (addItem) { addItemTo(addItem.dataset.addItem); return; }

      const act = e.target.closest('[data-act]');
      if (act) { handleAct(act.dataset.act); return; }

      const toggle = e.target.closest('[data-toggle]');
      if (toggle) {
        const id = toggle.dataset.toggle;
        if (openCards.has(id)) openCards.delete(id); else openCards.add(id);
        toggle.parentElement.classList.toggle('open');
      }
    });
  }

  function clampLayout(key, v) {
    const R = {
      fsBody: [9, 20], fsHead: [10, 26], lhBody: [1.2, 2.6],
      gapSec: [0, 60], gapItem: [0, 40],
      padT: [0, 140], padR: [0, 140], padB: [0, 140], padL: [0, 140]
    }[key];
    if (!R) return v;
    return Math.min(R[1], Math.max(R[0], Math.round(v * 100) / 100));
  }

  function addSection(type) {
    const t = SEC_TYPES[type];
    const sec = { id: uid(), type, title: t.name, col: type === 'experience' || type === 'project' ? 'main' : 'side' };
    if (t.kind === 'items') sec.items = [{ id: uid(), role: '', title: '', start: '', end: '', desc: '' }];
    if (t.kind === 'tags') sec.tags = '';
    if (t.kind === 'text') sec.text = '';
    // 插到同类模块后面
    const idx = state.sections.map((s) => s.type).lastIndexOf(type);
    if (idx >= 0) state.sections.splice(idx + 1, 0, sec);
    else state.sections.push(sec);
    openCards.add(sec.id);
    markDirty();
    renderEditor(); renderPage();
    const el = $(`[data-card="${sec.id}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
    toast('已添加「' + t.name + '」模块');
  }

  function addItemTo(secId) {
    const s = state.sections.find((x) => x.id === secId);
    if (!s) return;
    s.items.push({ id: uid(), role: '', title: '', start: '', end: '', desc: '' });
    markDirty(); renderEditor(); renderPage();
    const card = $(`[data-card="${secId}"]`);
    if (card) { card.classList.add('open'); openCards.add(secId); }
    const subs = card ? card.querySelectorAll('.sub') : [];
    if (subs.length) subs[subs.length - 1].scrollIntoView({ block: 'nearest' });
  }

  function moveSection(id, dir) {
    const i = secIndex(id);
    if (i < 0) return;
    if (dir === 'del') {
      const s = state.sections[i];
      if (!confirm('确定删除「' + (s.title || '该模块') + '」？此操作不可撤销。')) return;
      state.sections.splice(i, 1);
    } else {
      const j = dir === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= state.sections.length) return;
      const tmp = state.sections[i];
      state.sections[i] = state.sections[j];
      state.sections[j] = tmp;
    }
    markDirty(); renderEditor(); renderPage();
  }

  function moveItem(secId, idx, dir) {
    const s = state.sections.find((x) => x.id === secId);
    if (!s) return;
    if (dir === 'del') {
      s.items.splice(idx, 1);
    } else {
      const j = dir === 'up' ? idx - 1 : idx + 1;
      if (j < 0 || j >= s.items.length) return;
      const tmp = s.items[idx];
      s.items[idx] = s.items[j];
      s.items[j] = tmp;
    }
    markDirty(); renderEditor(); renderPage();
  }

  /* ---------------- 预览节流 ---------------- */
  let previewRaf = 0;
  function schedulePreview() {
    if (exporting) return; // 导出期间不改动 DOM，导出结束后统一重绘
    if (previewRaf) return;
    previewRaf = requestAnimationFrame(() => { previewRaf = 0; renderPage(); });
  }

  /* ---------------- 动作 ---------------- */
  async function handleAct(act) {
    switch (act) {
      case 'save': {
        clearTimeout(saveTimer);
        const ok = await save();
        if (ok === false) break; // save() 内部已提示失败，不能再盖一句「已保存」
        if (!dirty) toast('已保存到本机');
        break;
      }
      case 'export-json': {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (state.meta.name || '简历') + '.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 3000);
        toast('已导出 JSON 文件');
        break;
      }
      case 'import-json':
        $('#fileJson').click();
        break;
      case 'pick-avatar':
        $('#fileAvatar').click();
        break;
      case 'save-avatar':
        await exportAvatar();
        break;
      case 'clear-avatar':
        state.meta.avatar = '';
        markDirty(); renderPage(); renderEditor();
        toast('已清除头像');
        break;
      case 'export-png':
        await exportPng();
        break;
      case 'export-pdf':
        await exportPdf();
        break;
      case 'quit':
        if (!confirm('退出后将关闭本地服务，确定吗？（简历已自动保存）')) return;
        await save(true);
        try { await api('/api/quit', {}); } catch (e) { /* ignore */ }
        document.body.innerHTML = '<div style="display:grid;place-items:center;height:100vh;font-size:15px;color:#5b6372">简历工具已退出，可以关闭此标签页。</div>';
        break;
      case 'zoom-in': setZoom(zoom + 0.1); break;
      case 'zoom-out': setZoom(zoom - 0.1); break;
      case 'zoom-fit': fitMode = true; fitPage(); break;
    }
  }

  /* ---------------- 头像 ---------------- */
  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  // 居中裁成正方形（头像框是圆形 + object-fit:cover，而 html2canvas 1.4.1 不支持
  // object-fit，直接存原图会导致导出的 PNG 里头像被拉伸，因此在入库存成正方形）。
  function downscale(dataUrl, max) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const out = Math.max(1, Math.min(max, side));
        const c = document.createElement('canvas');
        c.width = out; c.height = out;
        const ctx = c.getContext('2d');
        // 先铺白底，避免透明 PNG 变黑
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, out, out);
        ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out);
        resolve(c.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  function bindFiles() {
    $('#fileAvatar').addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!f) return;
      if (!/^image\//.test(f.type)) { toast('请选择图片文件', true); return; }
      const raw = await readFileAsDataURL(f);
      state.meta.avatar = await downscale(raw, 420);
      markDirty(); renderPage();
      toast('头像已更新');
    });

    $('#fileJson').addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!f) return;
      try {
        const text = await f.text();
        const data = JSON.parse(text);
        if (!data || !data.meta || !Array.isArray(data.sections)) throw new Error('文件结构不正确');
        if (!confirm('导入将覆盖当前简历内容，确定吗？')) return;
        state = normalize(data);
        openCards.clear();
        openCards.add('__meta');
        markDirty(); renderEditor(); renderPage();
        await save(true);
        toast('导入成功');
      } catch (err) {
        toast('导入失败：' + err.message, true);
      }
    });
  }

  /* ---------------- 数据规范化 ---------------- */
  function normalize(d) {
    const base = defaultResume();
    const out = {
      meta: Object.assign({}, base.meta, d.meta || {}),
      metaFields: [],
      theme: Object.assign({}, base.theme, d.theme || {}),
      layout: Object.assign({}, base.layout, d.layout || {}),
      sections: []
    };

    // 字段名：按默认顺序合并，保留用户改名与显示开关
    const src = Array.isArray(d.metaFields) ? d.metaFields : [];
    const byKey = {};
    src.forEach((f) => { if (f && f.key) byKey[f.key] = f; });
    out.metaFields = META_FIELDS.map((f) => {
      const s = byKey[f.key] || {};
      return {
        key: f.key,
        label: String(s.label == null ? f.label : s.label),
        show: s.show === undefined ? true : !!s.show
      };
    });
    // 保留用户自定义、但不在默认列表里的字段（值仍存在 meta 上）
    src.forEach((f) => {
      if (f && f.key && !META_FIELDS.some((x) => x.key === f.key)) {
        out.metaFields.push({ key: f.key, label: String(f.label || f.key), show: f.show !== false });
      }
    });

    // 全局排版：逐项校验，非法值回落默认
    const L = out.layout;
    DENSITY_KEYS.forEach((k) => { L[k] = clampLayout(k, Number(L[k])); if (!isFinite(L[k])) L[k] = base.layout[k]; });
    if (!BULLETS.some((b) => b.id === L.bullet)) L.bullet = 'diamond';
    if (COLONS.indexOf(L.colon) < 0) L.colon = '：';
    L.showLabel = L.showLabel !== false;
    L.sideLeft = L.sideLeft === true;

    (d.sections || []).forEach((s) => {
      const type = SEC_TYPES[s.type] ? s.type : 'custom';
      const t = SEC_TYPES[type];
      const sec = { id: s.id || uid(), type, title: s.title || t.name, col: s.col === 'side' ? 'side' : 'main' };
      if (t.kind === 'items') {
        sec.items = (s.items || []).map((it) => ({
          id: it.id || uid(), role: it.role || '', title: it.title || '',
          start: it.start || '', end: it.end || '',
          // 旧存档的 desc 是纯文本，descToHtml 会在渲染时自动转成列表
          desc: sanitizeHtml(descToHtml(it.desc))
        }));
      } else if (t.kind === 'tags') {
        sec.tags = s.tags || '';
      } else {
        sec.text = s.text || '';
      }
      out.sections.push(sec);
    });
    if (!out.sections.length) out.sections = base.sections;
    if (!THEMES[out.theme.color]) out.theme.color = 'blue';

    // 旧版本的 compact 是「模板」，现在拆成了独立密度，这里做一次平滑迁移
    if (out.theme.template === 'compact') {
      out.theme.template = 'classic';
      out.layout = Object.assign({}, DENSITY.compact);
      out.layout.colon = L.colon;
      out.layout.bullet = L.bullet;
      out.layout.showLabel = L.showLabel;
      out.layout.sideLeft = L.sideLeft;
    }
    if (!TEMPLATES.some((x) => x.id === out.theme.template)) out.theme.template = 'modern';
    return out;
  }

  /* ---------------- 导出 PNG / 头像 ---------------- */
  let exporting = false;

  async function capturePage() {
    if (typeof html2canvas !== 'function') throw new Error('html2canvas 未加载');
    const page = $('#page');
    const wrap = $('#paperWrap');
    const oldTransform = wrap.style.transform;
    const oldHeight = wrap.style.height;
    const oldWidth = wrap.style.width;
    const oldTransition = wrap.style.transition;
    const oldHeightPage = page.style.height;
    const oldOverflow = page.style.overflow;

    exporting = true; // 让预览在这期间停止重绘，避免截图截到一半被 innerHTML 换掉
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    // 分页参考线只属于编辑视图，绝不能出现在导出的图片里。
    const guides = $('#pgGuides');
    const oldGuides = guides ? guides.style.display : '';
    if (guides) guides.style.display = 'none';

    // 关掉 .16s 的过渡动画，否则 80ms 后 html2canvas 拍到的还是缩放中间态。
    // 同时把 fitPage() 写进去的「缩放后宽高」清掉，否则外层容器会窄于页面本体。
    wrap.style.transition = 'none';
    wrap.style.transform = 'none';
    wrap.style.width = 'auto';
    wrap.style.height = 'auto';
    page.style.height = 'auto';
    page.style.overflow = 'visible';
    await new Promise((r) => setTimeout(r, 80));

    const fullHeight = Math.max(1123, page.scrollHeight);
    page.style.height = fullHeight + 'px';
    page.style.overflow = 'hidden';
    try {
      // 超长简历在 2 倍分辨率下画布会过大，降到 1.5 倍以求稳。
      const scale = fullHeight > 5000 ? 1.5 : 2;
      const canvas = await html2canvas(page, {
        scale: scale,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        width: page.offsetWidth,
        height: fullHeight,
        windowWidth: page.offsetWidth,
        windowHeight: fullHeight
      });
      return canvas.toDataURL('image/png');
    } finally {
      page.style.height = oldHeightPage;
      page.style.overflow = oldOverflow;
      wrap.style.transform = oldTransform;
      wrap.style.width = oldWidth;
      wrap.style.height = oldHeight;
      wrap.style.transition = oldTransition;
      if (guides) guides.style.display = oldGuides;
      exporting = false;
      fitPage();
    }
  }

  function safeFileName(name, ext) {
    const base = (name || '简历').replace(/[\\/:*?"<>|\r\n]+/g, '_').slice(0, 40);
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${base}_简历_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.${ext}`;
  }

  async function exportPng() {
    loading(true, '正在渲染图片…');
    try {
      const data = await capturePage();
      const filename = safeFileName(state.meta.name, 'png');
      const r = await api('/api/export', { kind: 'png', name: filename, data: data.replace(/^data:image\/png;base64,/, '') });
      toast('图片已保存：' + r.path);
    } catch (e) {
      toast('保存图片失败：' + e.message, true);
    } finally {
      loading(false);
    }
  }

  async function exportAvatar() {
    if (!state.meta.avatar) { toast('还没有设置头像', true); return; }
    loading(true, '正在保存头像…');
    try {
      const data = state.meta.avatar;
      const isJpeg = /^data:image\/jpeg/.test(data);
      const filename = safeFileName((state.meta.name || '头像') + '_头像', isJpeg ? 'jpg' : 'png');
      const b64 = data.replace(/^data:image\/[a-z+]+;base64,/, '');
      const r = await api('/api/export', { kind: 'avatar', name: filename, data: b64 });
      toast('头像已保存：' + r.path);
    } catch (e) {
      toast('保存头像失败：' + e.message, true);
    } finally {
      loading(false);
    }
  }

  /* ---------------- 导出 PDF ---------------- */
  async function exportPdf() {
    loading(true, '正在生成 PDF…');
    try {
      await save(true);
      // 先试浏览器内核直接打印；同时准备一张整页截图做兜底。
      let data = '';
      try {
        const shot = await capturePage();
        data = shot.replace(/^data:image\/png;base64,/, '');
      } catch (e) { /* 截图失败就不带兜底数据 */ }
      const r = await api('/api/pdf', { name: safeFileName(state.meta.name, 'pdf'), data: data });
      toast('PDF 已保存：' + r.path);
    } catch (e) {
      loading(false);
      toast('生成 PDF 失败：' + e.message + '（已打开打印窗口，请选择「另存为 PDF」）', true);
      setTimeout(() => window.print(), 600);
      return;
    }
    loading(false);
  }

  /* ---------------- 打印模式 ---------------- */
  // 仅用于「在浏览器标签页里直接看 / 手动 Ctrl+P」的场景。
  // 注意：必须限定在 screen 媒体下，否则会覆盖 style.css 里 @media print 的纸张规则，
  // 导致 headless 打印 / 另存为 PDF 时内容贴边或边距被改掉。
  function printMode() {
    document.body.classList.add('print-mode');
    document.title = (state.meta.name || '简历') + ' - 简历';
    const st = document.createElement('style');
    st.textContent = `@media screen{
      .topbar,.editor,.stage-bar,.statusbar{display:none!important}
      .app{display:block;height:auto}
      .workspace{display:block}
      .stage-scroll{display:block;overflow:visible;padding:0;background:#fff}
      .paper-wrap{transform:none!important;height:auto!important;width:auto!important}
      .page{box-shadow:none!important;margin:0 auto!important;width:210mm;min-height:0;box-sizing:border-box}
      .avatar .tip{display:none}
      .pg-guides{display:none!important}
    }`;
    document.head.appendChild(st);
  }

  /* ---------------- 顶部按钮 ---------------- */
  function bindToolbar() {
    $('.topbar').addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]');
      if (act) handleAct(act.dataset.act);
    });
    $('.stage-bar').addEventListener('click', (e) => {
      const tpl = e.target.closest('[data-tpl]');
      if (tpl) {
        state.theme.template = tpl.dataset.tpl;
        markDirty(); renderBar(); renderPage(); renderEditor();
        return;
      }
      const den = e.target.closest('[data-density]');
      if (den) {
        const d = DENSITY[den.dataset.density];
        if (d) {
          DENSITY_KEYS.forEach((k) => { state.layout[k] = d[k]; });
          markDirty(); renderBar(); renderPage(); renderEditor();
          toast('已套用「' + d.name + '」排版');
        }
        return;
      }
      const color = e.target.closest('[data-color]');
      if (color) {
        state.theme.color = color.dataset.color;
        markDirty(); renderBar(); renderPage();
        return;
      }
      const act = e.target.closest('[data-act]');
      if (act) handleAct(act.dataset.act);
    });
    window.addEventListener('resize', () => { if (fitMode) fitPage(); });
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleAct('save');
      }
    });
  }

  /* ---------------- 启动 ---------------- */
  async function boot() {
    bindEditor();
    bindToolbar();
    bindFiles();
    try {
      const r = await api('/api/resume');
      if (r.data && r.data.resume && Array.isArray(r.data.resume.sections)) {
        state = normalize(r.data.resume);
      }
      $('#exportPath').textContent = '导出目录：' + (r.exportDir || '—');
      $('#verTag').textContent = 'v' + (r.version || '1.0');
    } catch (e) {
      $('#saveState').textContent = '未能读取本地存档，使用默认模板';
    }

    if (new URLSearchParams(location.search).get('mode') === 'print') {
      printMode();
      openCards.clear();
      renderEditor();
      renderPage();
      fitMode = true; zoom = 1; fitPage();
      document.body.dataset.ready = '1';
      return;
    }

    openCards.add('__meta');
    openCards.add('__layout');
    renderEditor();
    renderPage();
    fitMode = true;
    fitPage();
    updateSaveState();
  }

  window.addEventListener('DOMContentLoaded', boot);
})();
