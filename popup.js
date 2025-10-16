document.getElementById("scanBtn").addEventListener("click", async () => {
  document.getElementById("status").innerText = "Running advanced scan...";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => window.postMessage({ type: "ADVANCED_SCAN" }, "*"),
  });

  document.getElementById("status").innerText = "Scan started!";
});
