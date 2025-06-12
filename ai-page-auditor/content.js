// 色リスト（半透明）
const overlayColors = [
  'rgba(255,0,0,0.2)',
  'rgba(0,128,255,0.2)',
  'rgba(0,200,0,0.2)',
  'rgba(255,200,0,0.2)',
  'rgba(200,0,255,0.2)',
  'rgba(0,255,200,0.2)'
];

// 既存オーバーレイを消す関数
function removeOverlays() {
  $('.ai-area-overlay').remove();
}

// 1度だけオーバーレイ用CSSを<head>に追加
function ensureOverlayStyle() {
  if (!document.getElementById('ai-area-overlay-style')) {
    const style = document.createElement('style');
    style.id = 'ai-area-overlay-style';
    style.textContent = `
      .ai-area-overlay { cursor: pointer !important; box-shadow: none; }
      .ai-area-overlay:hover { cursor: pointer !important; }
    `;
    document.head.appendChild(style);
  }
}

// サイドバーを表示
function showAISidebar(resultText) {
  // 既存サイドバーを消す
  $('.ai-sidebar').remove();
  const $sidebar = $('<div class="ai-sidebar"></div>');
  $sidebar.css({
    position: 'fixed',
    top: 0,
    right: 0,
    width: '400px',
    height: '100vh',
    background: '#fff',
    color: '#222',
    zIndex: 1000000,
    boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
    padding: '1em',
    overflowY: 'auto',
    fontSize: '14px',
    fontFamily: 'sans-serif',
    display: 'flex',
    flexDirection: 'column',
  });
  const $close = $('<button style="position:absolute;top:8px;right:8px;z-index:2;">×</button>');
  $close.on('click', () => $sidebar.remove());
  $sidebar.append($close);
  $sidebar.append('<h3 style="margin-top:0;">AI改善提案</h3>');
  if (resultText === 'loading') {
    $sidebar.append('<div class="ai-md" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:200px;">'
      +'<div class="ai-spinner" style="width:48px;height:48px;border:6px solid #ccc;border-top:6px solid #2196f3;border-radius:50%;animation:ai-spin 1s linear infinite;margin-bottom:16px;"></div>'
      +'<div style="font-size:18px;color:#222;text-align:center;">要素を解析中...</div>'
      +'</div>');
    if (!document.getElementById('ai-spin-style')) {
      const style = document.createElement('style');
      style.id = 'ai-spin-style';
      style.textContent = '@keyframes ai-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }
  } else {
    // マークダウン→HTML変換（簡易）
    function simpleMarkdown(md) {
      const lines = md.split(/\r?\n/);
      let html = '';
      let inOl = false, inUl = false, olNum = 1;
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        // 番号付きリスト
        const olMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
        if (olMatch) {
          if (!inOl) { html += '<ul style="list-style-type:none;padding-left:1.2em;">'; inOl = true; olNum = parseInt(olMatch[1], 10) || 1; }
          html += `<li>${olNum}. ${olMatch[2]}</li>`;
          olNum++;
          continue;
        } else if (inOl) {
          html += '</ul>'; inOl = false; olNum = 1;
        }
        // 箇条書きリスト
        const ulMatch = line.match(/^\s*[-\*]\s+(.*)$/);
        if (ulMatch) {
          if (!inUl) { html += '<ul>'; inUl = true; }
          html += `<li>${ulMatch[1]}</li>`;
          continue;
        } else if (inUl) {
          html += '</ul>'; inUl = false;
        }
        // 見出し
        if (/^### (.*)/.test(line)) {
          html += `<h3>${RegExp.$1}</h3>`;
        } else if (/^## (.*)/.test(line)) {
          html += `<h2>${RegExp.$1}</h2>`;
        } else if (/^# (.*)/.test(line)) {
          html += `<h1>${RegExp.$1}</h1>`;
        } else if (line.trim() === '') {
          html += (!inOl && !inUl) ? '<br>' : '';
        } else {
          // 強調・斜体
          let l = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>');
          html += l + ((!inOl && !inUl) ? '<br>' : '');
        }
      }
      if (inOl) html += '</ul>';
      if (inUl) html += '</ul>';
      return html;
    }
    $sidebar.append(`<div class="ai-md">${simpleMarkdown(resultText)}</div>`);
    // マークダウン用CSS
    if (!document.getElementById('ai-md-style')) {
      const style = document.createElement('style');
      style.id = 'ai-md-style';
      style.textContent = `
        .ai-md h1 { font-size: 1.4em; margin: 1em 0 0.5em; }
        .ai-md h2 { font-size: 1.2em; margin: 1em 0 0.5em; }
        .ai-md h3 { font-size: 1.1em; margin: 1em 0 0.5em; }
        .ai-md ul, .ai-md ol { margin: 0.5em 0 0.5em 1.2em; }
        .ai-md ol { list-style-type: decimal !important; margin-left: 1.5em; }
        .ai-md li { margin-bottom: 0.3em; }
        .ai-md strong { font-weight: bold; color: #1976d2; }
        .ai-md em { color: #d2691e; }
        .ai-md br { display: block; margin: 0.2em 0; }
      `;
      document.head.appendChild(style);
    }
  }
  $('body').append($sidebar);
}

// 大きなエリアを検出してオーバーレイを重ねる
function highlightLargeAreas() {
  removeOverlays();
  ensureOverlayStyle();
  console.log('[content.js] highlightLargeAreas start');
  // 対象タグ
  const selectors = 'main, section, article, div';
  // 画面の1/32以上の面積を持つ要素を対象（デバッグ用に緩和）
  const minArea = (window.innerWidth * window.innerHeight) / 32;
  let colorIdx = 0;
  $(selectors).each(function (i, el) {
    const rect = el.getBoundingClientRect();
    const area = rect.width * rect.height;
    if (area < minArea) return;
    console.log('[content.js] overlay for', el, 'area:', area);
    // オーバーレイdivを作成
    const $overlay = $('<div class="ai-area-overlay"></div>');
    const color = overlayColors[colorIdx % overlayColors.length];
    const colorStrong = color.replace('0.2', '0.5');
    $overlay.css({
      position: 'absolute',
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height,
      background: color,
      zIndex: 999999,
      pointerEvents: 'auto',
      cursor: 'pointer !important',
      border: '2px solid ' + color.replace('0.2', '0.7'),
      transition: 'background 0.2s, border 0.2s',
    });
    $overlay.attr('data-ai-area-idx', i);
    $overlay.on('mouseenter', function () {
      $(this).css({
        background: colorStrong,
        border: '3px solid ' + color.replace('0.2', '1.0'),
        boxShadow: '0 0 0 4px ' + colorStrong,
        cursor: 'pointer !important',
      });
    });
    $overlay.on('mouseleave', function () {
      $(this).css({
        background: color,
        border: '2px solid ' + color.replace('0.2', '0.7'),
        boxShadow: 'none',
        cursor: 'pointer !important',
      });
    });
    $overlay.on('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      removeOverlays();
      showAISidebar('loading');
      setTimeout(() => analyzeArea(el), 0);
    });
    $('body').append($overlay);
    colorIdx++;
  });
}

// 指定エリア配下だけをAI解析
function analyzeArea(rootEl) {
  const $ = window.jQuery;
  const allSummaries = [];
  $(rootEl).find('*').each(function () {
    const tag = $(this).prop('tagName');
    const classes = $(this).attr('class');
    const text = $(this).text().trim().slice(0, 50);
    if (text && tag !== 'SCRIPT' && tag !== 'STYLE') {
      allSummaries.push(`${tag}${classes ? '.' + classes.replace(/\s+/g, '.') : ''}: ${text}`);
    }
  });
  const maxChunkLength = 6000;
  const chunks = [];
  let currentChunk = '';
  for (const summary of allSummaries) {
    if ((currentChunk.length + summary.length + 1) > maxChunkLength) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += (currentChunk ? '\n' : '') + summary;
  }
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  const results = [];
  (async () => {
    for (const [idx, chunk] of chunks.entries()) {
      const prompt = `以下のHTML構造の要素（パート${idx + 1}/${chunks.length}）をまとめて分析し、似たような要素はグループごとに要約し、UX改善提案を1〜2点だけ簡潔に日本語で答えてください。\n\n${chunk}`;
      console.log(`[content.js] エリア解析プロンプト(パート${idx + 1}):`, prompt);
      try {
        const res = await fetch('https://ai-page-auditor.vercel.app/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        const data = await res.json();
        console.log(`[content.js] エリアAPIレスポンスbody(パート${idx + 1}):`, data);
        results.push(`【パート${idx + 1}】\n${data.result}`);
      } catch (e) {
        results.push(`【パート${idx + 1}】\nAPI通信エラー: ${e.message}`);
      }
    }
    const merged = results.join('\n---\n');
    showAISidebar(merged);
  })();
}

// popupやbackgroundからのメッセージでエリアハイライトを起動
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'HIGHLIGHT_AREAS') {
    highlightLargeAreas();
    sendResponse({ result: 'OK' });
    return;
  }
  if (msg.type === 'REMOVE_OVERLAYS') {
    removeOverlays();
    return;
  }
  if (msg.type === 'RUN_ANALYSIS') {
    (async () => {
      const $ = window.jQuery;
      const allSummaries = [];
      $('*').each(function () {
        const tag = $(this).prop('tagName');
        const classes = $(this).attr('class');
        const text = $(this).text().trim().slice(0, 50);
        if (text && tag !== 'SCRIPT' && tag !== 'STYLE') {
          allSummaries.push(`${tag}${classes ? '.' + classes.replace(/\s+/g, '.') : ''}: ${text}`);
        }
      });
      // 6000文字以内で\n区切りで分割
      const maxChunkLength = 6000;
      const chunks = [];
      let currentChunk = '';
      for (const summary of allSummaries) {
        if ((currentChunk.length + summary.length + 1) > maxChunkLength) {
          chunks.push(currentChunk);
          currentChunk = '';
        }
        currentChunk += (currentChunk ? '\n' : '') + summary;
      }
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      const results = [];
      for (const [idx, chunk] of chunks.entries()) {
        const prompt = `以下のHTML構造の要素（パート${idx + 1}/${chunks.length}）をまとめて分析し、似たような要素はグループごとに要約し、UX改善提案を1〜2点だけ簡潔に日本語で答えてください。\n\n${chunk}`;
        console.log(`[content.js] 送信プロンプト(パート${idx + 1}):`, prompt);
        try {
          const res = await fetch('https://ai-page-auditor.vercel.app/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
          });
          const data = await res.json();
          console.log(`[content.js] APIレスポンスbody(パート${idx + 1}):`, data);
          results.push(`【パート${idx + 1}】\n${data.result}`);
        } catch (e) {
          results.push(`【パート${idx + 1}】\nAPI通信エラー: ${e.message}`);
        }
      }
      const merged = results.join('\n---\n');
      showAISidebar(merged);
    })();
    return true; // 非同期応答
  }
}); 