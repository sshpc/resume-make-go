/* 简历工具 · 前端逻辑（无构建、无依赖，除 html2canvas） */
(function () {
  'use strict';

  const TOKEN = window.__RESUME_TOKEN__ || '';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* ---------------- 常量 ---------------- */
  const THEMES = {
    blue:   { name: '藏青', ac: '#2a55c7', soft: '#eef2fd', line: '#d3ddf6', deep: '#1e3f9a' },
    ink:    { name: '墨黑', ac: '#333a48', soft: '#f0f2f5', line: '#d8dce4', deep: '#20242e' },
    green:  { name: '青竹', ac: '#16785e', soft: '#e9f6f1', line: '#cfe9e0', deep: '#0f5744' },
    amber:  { name: '赤陶', ac: '#b45a1e', soft: '#fdf1e7', line: '#f1dcc8', deep: '#8a4314' },
    violet: { name: '紫藤', ac: '#6343b8', soft: '#f1edfc', line: '#ded5f7', deep: '#4a3091' },
    teal:   { name: '湖蓝', ac: '#0d7285', soft: '#e8f5f7', line: '#cbe7ec', deep: '#085263' }
  };

  const TEMPLATES = [
    { id: 'modern',  name: '现代双栏' },
    { id: 'accent',  name: '侧栏色块' },
    { id: 'classic', name: '经典单栏' },
    { id: 'compact', name: '紧凑排版' }
  ];

  const SEC_TYPES = {
    experience: { name: '工作经历', kind: 'items', role: '公司 / 组织', title: '职位名称', add: '新增一段经历' },
    project:    { name: '项目经历', kind: 'items', role: '项目名称',   title: '担任角色', add: '新增一个项目' },
    education:  { name: '教育背景', kind: 'items', role: '学校名称',   title: '专业 / 学历', add: '新增一段学历' },
    skills:     { name: '技能标签', kind: 'tags' },
    custom:     { name: '自定义模块', kind: 'text' }
  };

  /* ---------------- 默认数据 ---------------- */
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
      theme: { color: 'blue', template: 'modern' },
      sections: [
        {
          id: uid(), type: 'experience', title: '工作经历', col: 'main',
          items: [
            {
              id: uid(), role: '杭州云启科技有限公司', title: '高级前端工程师', start: '2021.03', end: '至今',
              desc: '负责企业级低代码平台前端架构，主导渲染引擎重构，首屏加载耗时从 3.4s 降至 1.1s\n搭建组件库与可视化编辑器，支撑 12 条业务线复用，节省重复开发约 40%\n推动前端工程化落地，接入单元测试与灰度发布，线上故障率下降 65%'
            },
            {
              id: uid(), role: '上海微光网络科技', title: '前端工程师', start: '2018.07', end: '2021.02',
              desc: '完成电商中台从 jQuery 到 Vue 的技术迁移，覆盖 30+ 页面模块\n优化商品详情页渲染策略，转化率提升 8.6%\n负责移动端 H5 性能治理，弱网首屏可用时间缩短至 1.8s'
            }
          ]
        },
        {
          id: uid(), type: 'project', title: '项目经历', col: 'main',
          items: [
            {
              id: uid(), role: '低代码可视化搭建平台', title: '前端负责人', start: '2022.04', end: '2023.12',
              desc: '设计拖拽画布与 schema 协议，支持 60+ 物料与嵌套布局\n实现运行时渲染引擎，页面产出效率提升约 3 倍\n沉淀性能监控与错误上报体系，问题定位时间从小时级缩短到分钟级'
            }
          ]
        },
        {
          id: uid(), type: 'education', title: '教育背景', col: 'side',
          items: [
            { id: uid(), role: '浙江大学', title: '计算机科学与技术 · 本科', start: '2014.09', end: '2018.06', desc: 'GPA 3.7 / 4.0，校级优秀毕业生' }
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

  /* ---------------- 编辑器渲染 ---------------- */
  function secIndex(id) { return state.sections.findIndex((s) => s.id === id); }

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
          <div class="add-row">
            <button class="chip-btn" data-act="pick-avatar">选择图片…</button>
            <button class="chip-btn solid" data-act="save-avatar">保存头像文件</button>
            <button class="chip-btn solid" data-act="clear-avatar">清除</button>
          </div>
        </div>
      </div>
    </div>`;

    /* 模块 */
    state.sections.forEach((s, i) => {
      const t = SEC_TYPES[s.type] || SEC_TYPES.custom;
      const isOpen = openCards.has(s.id);
      html += `<div class="blk ${isOpen ? 'open' : ''}" data-card="${s.id}">
        <div class="blk-head" data-toggle="${s.id}">
          <span class="t"><span class="idx">${i + 2}</span>${esc(s.title || t.name)}</span>
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
          ${s.col ? `<div class="field" style="flex:0 0 132px"><label>位置</label>
            <select data-bind="sections.${i}.col">
              <option value="main" ${s.col === 'main' ? 'selected' : ''}>左侧主栏</option>
              <option value="side" ${s.col === 'side' ? 'selected' : ''}>右侧辅栏</option>
            </select></div>` : ''}
        </div>`;

      if (t.kind === 'items') {
        if (!s.items.length) html += `<div class="empty">还没有内容，点下面的按钮添加</div>`;
        s.items.forEach((it, j) => {
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
            <div class="field"><label>描述 <span class="hint">（每行一条，自动排成要点）</span></label>
              <textarea rows="4" data-bind="sections.${i}.items.${j}.desc">${esc(it.desc)}</textarea></div>
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

  /* ---------------- 顶部工具条（模板 / 配色） ---------------- */
  function renderBar() {
    $('#templateGroup').innerHTML = '<span class="lbl">模板</span>' + TEMPLATES.map((t) =>
      `<button class="mini ${state.theme.template === t.id ? 'on' : ''}" data-tpl="${t.id}"
        style="${state.theme.template === t.id ? 'border-color:#9db6f7;background:#f2f6ff;color:#2049b8' : ''}">${t.name}</button>`
    ).join('');

    $('#themeGroup').innerHTML = '<span class="lbl">配色</span>' + Object.keys(THEMES).map((k) =>
      `<button class="swatch ${state.theme.color === k ? 'on' : ''}" data-color="${k}"
        title="${THEMES[k].name}" style="background:${THEMES[k].ac}"></button>`
    ).join('');
    $('#zoomVal').textContent = Math.round(zoom * 100) + '%';
  }

  /* ---------------- 预览渲染 ---------------- */
  function applyTheme() {
    const t = THEMES[state.theme.color] || THEMES.blue;
    const page = $('#page');
    page.style.setProperty('--ac', t.ac);
    page.style.setProperty('--ac-soft', t.soft);
    page.style.setProperty('--ac-line', t.line);
    page.style.setProperty('--ac-deep', t.deep);
    page.className = 'page tpl-' + state.theme.template;
  }

  function metaItems(m) {
    const list = [
      ['手机', m.phone], ['邮箱', m.email], ['城市', m.city],
      ['性别', m.gender], ['出生', m.birth], ['经验', m.years], ['主页', m.website]
    ];
    return list.filter((x) => x[1] && String(x[1]).trim());
  }

  function renderSection(s) {
    const t = SEC_TYPES[s.type] || SEC_TYPES.custom;
    let body = '';

    if (t.kind === 'items') {
      body = s.items.filter(itemHasContent).map((it) => {
        const lines = String(it.desc || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
        return `<div class="item">
          <div class="item-top">
            <span class="org">${esc(it.role)}</span>
            ${it.role && it.title ? '<span class="pin"></span>' : ''}
            <span class="role">${esc(it.title)}</span>
            ${it.start || it.end ? `<span class="pin"></span><span class="date">${esc(it.start)}${it.start && it.end ? ' — ' : ''}${esc(it.end)}</span>` : ''}
          </div>
          ${lines.length > 1
            ? `<ul class="bl">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`
            : lines.length === 1 ? `<div class="plain">${esc(lines[0])}</div>` : ''}
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

  function itemHasContent(it) {
    return ['role', 'title', 'desc'].some((k) => String(it[k] || '').trim());
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
        <div class="meta">${metaItems(m).map((x) => `<span><i></i>${esc(x[1])}</span>`).join('')}</div>
      </div>
    </div>`;

    const single = state.theme.template === 'classic' || state.theme.template === 'compact';
    let bodyHtml;
    if (single) {
      bodyHtml = `<div class="rbody">${state.sections.map(renderSection).join('')}</div>`;
    } else {
      const mains = state.sections.filter((s) => s.col !== 'side');
      const sides = state.sections.filter((s) => s.col === 'side');
      bodyHtml = `<div class="rbody">
        <div class="rcol-main">${mains.map(renderSection).join('')}</div>
        ${sides.length ? `<div class="rcol-side">${sides.map(renderSection).join('')}</div>` : ''}
      </div>`;
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
      const path = el.dataset.bind;
      if (!path) return;
      setPath(state, path, el.value);
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
            head.innerHTML = `<span class="idx">${i + 2}</span>${esc(sec.title || t.name)}`;
          }
        }
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
        markDirty(); renderEditor(); renderPage();
        await save(true);
        toast('导入成功');
      } catch (err) {
        toast('导入失败：' + err.message, true);
      }
    });
  }

  function normalize(d) {
    const base = defaultResume();
    const out = {
      meta: Object.assign({}, base.meta, d.meta || {}),
      theme: Object.assign({}, base.theme, d.theme || {}),
      sections: []
    };
    (d.sections || []).forEach((s) => {
      const type = SEC_TYPES[s.type] ? s.type : 'custom';
      const t = SEC_TYPES[type];
      const sec = { id: s.id || uid(), type, title: s.title || t.name, col: s.col === 'side' ? 'side' : 'main' };
      if (t.kind === 'items') {
        sec.items = (s.items || []).map((it) => ({
          id: it.id || uid(), role: it.role || '', title: it.title || '',
          start: it.start || '', end: it.end || '', desc: it.desc || ''
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

    // 关掉 .16s 的过渡动画，否则 60ms 后 html2canvas 拍到的还是缩放中间态。
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
  // 注意：必须限定在 screen 媒体下，否则会覆盖 style.css 里 @media print 的纸张边距，
  // 导致 headless 打印 / 另存为 PDF 时内容贴边。
  function printMode() {
    document.body.classList.add('print-mode');
    document.title = (state.meta.name || '简历') + ' - 简历';
    const st = document.createElement('style');
    st.textContent = `@media screen{
      .topbar,.editor,.stage-bar,.statusbar{display:none!important}
      .app{display:block;height:auto}
      .workspace{display:block}
      .stage-scroll{display:block;overflow:visible;padding:0;background:#fff}
      .paper-wrap{transform:none!important;height:auto!important}
      .page{box-shadow:none!important;margin:0 auto!important;width:210mm;min-height:0;padding:12mm 13mm;box-sizing:border-box}
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
    openCards.add(state.sections.length ? state.sections[0].id : '__meta');
    renderEditor();
    renderPage();
    fitMode = true;
    fitPage();
    updateSaveState();
  }

  window.addEventListener('DOMContentLoaded', boot);
})();
