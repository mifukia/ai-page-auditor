chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'RUN_ANALYSIS') {
    chrome.tabs.sendMessage(msg.tabId, { type: 'RUN_ANALYSIS' }, sendResponse);
    return true; // 非同期応答
  }
}); 