// ポップアップopen時に色分けエリア表示
window.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('toggle-highlight');
  toggle.checked = false;
  toggle.addEventListener('change', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (toggle.checked) {
      chrome.tabs.sendMessage(tab.id, { type: 'HIGHLIGHT_AREAS' });
    } else {
      chrome.tabs.sendMessage(tab.id, { type: 'REMOVE_OVERLAYS' });
    }
  });
});

// ポップアップclose時に100ms遅延してオーバーレイ消去
window.addEventListener('unload', async () => {
  setTimeout(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { type: 'REMOVE_OVERLAYS' });
  }, 100);
}); 