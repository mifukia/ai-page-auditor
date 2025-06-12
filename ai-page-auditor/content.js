chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.type === 'RUN_ANALYSIS') {
    const $ = window.jQuery;
    const domSummary = [];
    $('*').each(function () {
      const tag = $(this).prop('tagName');
      const classes = $(this).attr('class');
      const text = $(this).text().trim().slice(0, 50);
      if (text && tag !== 'SCRIPT' && tag !== 'STYLE') {
        domSummary.push(`${tag}${classes ? '.' + classes.replace(/\s+/g, '.') : ''}: ${text}`);
      }
    });
    const prompt = `以下のHTML構造の要素を分析し、UX改善提案を3点だけ簡潔に日本語で答えてください:\n\n${domSummary.slice(0, 50).join('\n')}`;
    console.log('[content.js] 送信プロンプト:', prompt);
    try {
      const res = await fetch('https://ai-page-auditor.vercel.app/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      console.log('[content.js] APIレスポンスstatus:', res.status);
      const data = await res.json();
      console.log('[content.js] APIレスポンスbody:', data);
      sendResponse({ result: data.result });
    } catch (e) {
      console.error('[content.js] API通信エラー:', e);
      sendResponse({ result: 'API通信エラー: ' + e.message });
    }
    return true; // 非同期応答
  }
}); 