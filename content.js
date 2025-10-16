// --- Cybersecurity heuristic tables ---
const BAD_KEYWORDS = ["phish", "malware", "ransom", "hack", "scam", "steal", "login", "verify", "bank", "secure", "account", "update"];
const BAD_TLDS = ["ru", "cn", "tk", "ml", "ga", "cf", "gq", "xyz", "top", "pw", "work", "fit", "biz"];
const ENTROPY_THRESHOLD = 4.0;

let paused = false;
let scanning = false;
let scanIndex = 0;
let elements = [];
let report = [];

window.addEventListener("message", async (event) => {
  const { type, paused: pauseState } = event.data;

  if (type === "ADVANCED_SCAN_START" || type === "ADVANCED_SCAN_RESTART") {
    if (scanning) return;
    scanning = true;
    paused = false;
    report = [];
    elements = [...document.querySelectorAll("a, img")];
    scanIndex = 0;
    await runScan();
  }

  if (type === "ADVANCED_SCAN_PAUSE") {
    paused = pauseState;
  }
});

async function runScan() {
  while (scanIndex < elements.length) {
    if (paused) {
      await waitForUnpause();
    }

    const el = elements[scanIndex];
    const url = el.tagName === "A" ? el.href : el.src;
    if (url) {
      const findings = analyzeURL(el, url);
      if (findings.length > 0) {
        el.style.border = "3px solid red";
        el.title = `⚠️ Suspicious:\n${findings.join("\n")}`;
        report.push({ url, findings });
      } else {
        el.style.border = "2px solid green";
        el.title = "✅ Clean";
      }
    }

    scanIndex++;
    await sleep(150); // Prevent UI freeze
  }

  scanning = false;
  showOverlay(report);
}

// Wait until resume
function waitForUnpause() {
  return new Promise((resolve) => {
    const check = setInterval(() => {
      if (!paused) {
        clearInterval(check);
        resolve();
      }
    }, 300);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


function analyzeURL(el, url) {
  const issues = [];
  const lower = url.toLowerCase();

  // 1. Keyword heuristic
  if (BAD_KEYWORDS.some(k => lower.includes(k)))
    issues.push("Contains suspicious keyword");

  // 2. TLD check
  const domain = extractDomain(url);
  const tld = domain.split(".").pop();
  if (BAD_TLDS.includes(tld))
    issues.push(`Untrusted TLD: .${tld}`);

  // 3. Entropy check (detects random strings)
  const path = url.split("/").slice(3).join("/");
  const entropy = calcEntropy(path);
  if (entropy > ENTROPY_THRESHOLD)
    issues.push(`High URL entropy (${entropy.toFixed(2)})`);

  // 4. Mismatched anchor text
  if (el.tagName === "A" && el.innerText.length > 0) {
    const text = el.innerText.toLowerCase();
    if (!lower.includes(text) && /[a-z]/.test(text))
      issues.push("Displayed text doesn't match link domain");
  }

  // 5. HTTP mixed content check
  if (url.startsWith("http://") && window.location.protocol === "https:")
    issues.push("Mixed-content risk (HTTP on HTTPS site)");

  // 6. Data URL detection
  if (url.startsWith("data:"))
    issues.push("Data URL detected (may hide malicious payload)");

  return issues;
}

// Helper: extract domain from URL
function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

// Helper: entropy calculation (measures randomness)
function calcEntropy(str) {
  const map = {};
  for (let c of str) map[c] = (map[c] || 0) + 1;
  let entropy = 0;
  for (let c in map) {
    const p = map[c] / str.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

// --- Overlay UI for results ---
function showOverlay(report) {
  const old = document.getElementById("scan-overlay");
  if (old) old.remove();

  const overlay = document.createElement("div");
  overlay.id = "scan-overlay";
  overlay.innerHTML = `
    <div style="background:#111;color:white;padding:15px;border-radius:10px;max-width:400px;max-height:60vh;overflow:auto;box-shadow:0 0 15px rgba(0,0,0,0.4);">
      <h3>🔎 Advanced Scan Results</h3>
      ${
        report.length === 0
          ? "<p>✅ No suspicious links or images found.</p>"
          : `<ul>${report
              .map(
                r =>
                  `<li><b>${r.url}</b><br><span style="color:#f66">${r.findings.join(
                    ", "
                  )}</span></li>`
              )
              .join("")}</ul>`
      }
      <button id="closeOverlay" style="background:#333;color:white;padding:6px 10px;border:none;border-radius:5px;margin-top:10px;cursor:pointer;">Close</button>
    </div>
  `;
  overlay.style.position = "fixed";
  overlay.style.top = "20px";
  overlay.style.right = "20px";
  overlay.style.zIndex = "999999";
  document.body.appendChild(overlay);

  document.getElementById("closeOverlay").onclick = () => overlay.remove();
}
