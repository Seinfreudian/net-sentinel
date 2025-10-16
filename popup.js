const scanBtn = document.getElementById("scanBtn");
const pauseBtn = document.getElementById("pauseBtn");
const statusText = document.getElementById("status");

let scanning = false;
let paused = false;

scanBtn.addEventListener("click", async () => {
  if (!scanning) {
    scanning = true;
    paused = false;
    statusText.innerText = "Running advanced scan...";
    pauseBtn.style.display = "block";
    scanBtn.innerText = "Restart Scan";

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => window.postMessage({ type: "ADVANCED_SCAN_START" }, "*"),
    });
  } else {
    // Restart the scan
    paused = false;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => window.postMessage({ type: "ADVANCED_SCAN_RESTART" }, "*"),
    });
  }
});

pauseBtn.addEventListener("click", async () => {
  paused = !paused;
  pauseBtn.innerText = paused ? "Resume Scan" : "Pause Scan";
  statusText.innerText = paused ? "Scan paused." : "Resuming scan...";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: (isPaused) => window.postMessage({ type: "ADVANCED_SCAN_PAUSE", paused: isPaused }, "*"),
    args: [paused]
  });
});
