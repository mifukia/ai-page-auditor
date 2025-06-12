document.getElementById('analyze').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { type: 'RUN_ANALYSIS' }, (response) => {
    document.getElementById('result').textContent = response && response.result
      ? response.result
      : '結果の取得に失敗しました';
  });
}); 