import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = 'http://127.0.0.1:5173/';
const outputDir = 'C:\\Users\\Lenovo\\AppData\\Local\\Temp\\archipedia-stage2-qa';
await mkdir(outputDir, { recursive: true });

const debuggerOrigin = 'http://127.0.0.1:9223';
const pageTarget = await fetch(`${debuggerOrigin}/json/new?${encodeURIComponent('about:blank')}`, {
  method: 'PUT'
}).then(response => response.json());
const socket = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let messageId = 0;
const pending = new Map();
const protocolEvents = [];
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  const request = pending.get(message.id);
  if (!request) {
    if (/^(Runtime\.exceptionThrown|Runtime\.consoleAPICalled|Log\.entryAdded|Network\.loadingFailed|Inspector\.targetCrashed)$/.test(message.method || '')) {
      protocolEvents.push(message);
    }
    return;
  }
  pending.delete(message.id);
  if (message.error) request.reject(new Error(JSON.stringify(message.error)));
  else request.resolve(message.result);
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++messageId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});

await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Network.enable');

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const evaluate = async expression => {
  const response = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  }
  return response.result.value;
};

const waitFor = async (expression, timeout = 10000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await wait(100);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
};

const setViewport = async (width, height, mobile = false) => {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height
  });
};

const navigate = async route => {
  await send('Page.navigate', { url: `${baseUrl}#/${route}` });
  await wait(1500);
};

const enterSplash = async () => {
  const present = await evaluate("Boolean(document.querySelector('app-splash-screen [role=button]'))");
  if (!present) return;
  await evaluate("document.querySelector('app-splash-screen [role=button]').click()");
  await waitFor("!document.querySelector('app-splash-screen')");
  await wait(350);
};

const capture = async name => {
  const screenshot = await send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false
  });
  const filePath = path.join(outputDir, name);
  await writeFile(filePath, Buffer.from(screenshot.data, 'base64'));
  return filePath;
};

const layoutMetrics = () => evaluate(`(() => ({
  width: innerWidth,
  height: innerHeight,
  scrollWidth: document.documentElement.scrollWidth,
  overflowX: document.documentElement.scrollWidth > innerWidth + 1,
  lang: document.documentElement.lang
}))()`);

const report = { screenshots: {}, checks: {} };

await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try {
    localStorage.setItem('arch_update_notice_seen_2026_07_19_experience_v2', 'true');
    localStorage.setItem('arch_services_nav_comet_seen_2026_07_05_v2', 'true');
<<<<<<< ours
    if (!localStorage.getItem('arch_app_locale_v1')) localStorage.setItem('arch_app_locale_v1', 'zh');
=======
    localStorage.setItem('arch_app_locale_v1', 'zh');
>>>>>>> theirs
  } catch {}`
});
await setViewport(1440, 900);
await navigate('encyclopedia');
await enterSplash();
if (!await evaluate("Boolean(document.querySelector('.encyclopedia-title'))")) {
  console.error(JSON.stringify(protocolEvents.slice(-30), null, 2));
}
await waitFor("Boolean(document.querySelector('.encyclopedia-title'))");
const typewriterSamples = [];
for (let index = 0; index < 8; index += 1) {
  typewriterSamples.push(await evaluate("document.querySelector('.encyclopedia-title')?.textContent.trim()"));
  await wait(700);
}
report.checks.encyclopedia = {
  layout: await layoutMetrics(),
  typewriterSamples,
  animationVaries: new Set(typewriterSamples).size > 1,
  reducedMotion: await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")
};
report.screenshots.encyclopediaZhDesktop = await capture('encyclopedia-zh-1440x900.png');

await navigate('standards');
await waitFor("Boolean(document.querySelector('article.ui-long-list-item'))");
const initialStandardsCount = await evaluate("document.querySelectorAll('app-standards article.ui-long-list-item').length");
await evaluate(`(() => {
  const candidates = [...document.querySelectorAll('*')].filter(element => {
    const style = getComputedStyle(element);
    return /(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 100;
  });
  const target = candidates.sort((a, b) => b.clientHeight - a.clientHeight)[0];
  if (target) {
    target.scrollTop = target.scrollHeight;
    target.dispatchEvent(new Event('scroll', { bubbles: true }));
  } else {
    scrollTo(0, document.body.scrollHeight);
  }
})()`);
await wait(1000);
const loadedStandardsCount = await evaluate("document.querySelectorAll('app-standards article.ui-long-list-item').length");
report.checks.standards = {
  initialCount: initialStandardsCount,
  afterScrollCount: loadedStandardsCount,
  progressive: initialStandardsCount === 30 && loadedStandardsCount > initialStandardsCount,
  layout: await layoutMetrics()
};
await evaluate(`(() => {
  const candidates = [...document.querySelectorAll('*')].filter(element => element.scrollHeight > element.clientHeight + 100);
  for (const element of candidates) element.scrollTop = 0;
  scrollTo(0, 0);
})()`);
await wait(250);
report.screenshots.standardsZhDesktop = await capture('standards-zh-1440x900.png');

await navigate('contact');
await waitFor("Boolean(document.querySelector('[aria-label=\"切换为英文\"]'))");
await evaluate("document.querySelector('[aria-label=\"切换为英文\"]').click()");
await waitFor("document.documentElement.lang === 'en'");
<<<<<<< ours
=======
await waitFor("document.body.innerText.includes('Resource Services')");
>>>>>>> theirs
report.checks.languageSwitch = {
  locale: await evaluate("localStorage.getItem('arch_app_locale_v1')"),
  lang: await evaluate("document.documentElement.lang"),
  navEnglish: await evaluate("document.body.innerText.includes('Resource Services')"),
  layout: await layoutMetrics()
};
report.screenshots.aboutEnDesktop = await capture('about-en-1440x900.png');

await navigate('resources');
await waitFor("Boolean(document.querySelector('.resource-panel'))");
report.checks.resourcesEnglish = {
  hasEnglishDescription: await evaluate("document.body.innerText.includes('Leading digital publications and news')"),
  hasFixedChineseDescription: await evaluate("document.body.innerText.includes('精选建筑数字出版物与资讯来源')"),
  layout: await layoutMetrics()
};
report.screenshots.resourcesEnDesktop = await capture('resources-en-1440x900.png');

await navigate('services');
await waitFor("Boolean(document.querySelector('.service-product-card'))");
<<<<<<< ours
await evaluate("document.querySelector('.service-product-card').click()");
=======
await evaluate("document.querySelector('.service-product-card').focus(); document.querySelector('.service-product-card').click()");
>>>>>>> theirs
await waitFor("Boolean(document.querySelector('.service-detail-shell'))");
await wait(350);
const desktopModal = await evaluate(`(() => {
  const modal = document.querySelector('.service-detail-shell');
  const qr = document.querySelector('.service-detail-contact .qr-soft-frame');
  const contact = document.querySelector('.service-detail-contact');
  const qrRect = qr.getBoundingClientRect();
  const contactRect = contact.getBoundingClientRect();
  return {
    focusInside: modal.contains(document.activeElement),
    focusedLabel: document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent?.trim(),
<<<<<<< ours
    bodyLocked: getComputedStyle(document.body).overflow === 'hidden',
=======
    bodyLocked: document.body.style.overflow === 'hidden',
>>>>>>> theirs
    qrVisible: qrRect.top >= 0 && qrRect.bottom <= innerHeight,
    contactVisible: contactRect.top >= 0 && contactRect.bottom <= innerHeight,
    qrSize: [Math.round(qrRect.width), Math.round(qrRect.height)],
    modalHeight: Math.round(modal.getBoundingClientRect().height)
  };
})()`);
report.checks.serviceModalDesktop = desktopModal;
report.screenshots.serviceModalEnDesktop = await capture('service-modal-en-1440x900.png');
<<<<<<< ours
<<<<<<< ours
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
await waitFor("!document.querySelector('.service-detail-shell')");
=======
=======
>>>>>>> theirs
await evaluate(`(() => {
  const focusable = [...document.querySelectorAll('.service-detail-shell button:not([disabled])')];
  focusable.at(-1)?.focus();
})()`);
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab' });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab' });
await wait(50);
report.checks.serviceModalDesktop.tabLoopsToFirst = await evaluate("document.activeElement?.getAttribute('aria-label') === 'Close details'");
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
await waitFor("!document.querySelector('.service-detail-shell')");
await wait(100);
<<<<<<< ours
>>>>>>> theirs
report.checks.serviceModalEscape = {
  restoredToTrigger: await evaluate("document.activeElement?.classList.contains('service-product-card') === true"),
  bodyUnlocked: await evaluate("getComputedStyle(document.body).overflow !== 'hidden'")
=======
report.checks.serviceModalEscape = {
  restoredToTrigger: await evaluate("document.activeElement?.classList.contains('service-product-card') === true"),
  bodyUnlocked: await evaluate("document.body.style.overflow !== 'hidden'")
>>>>>>> theirs
};

await setViewport(390, 844, true);
await send('Page.reload');
await wait(1800);
await enterSplash();
await waitFor("Boolean(document.querySelector('.service-product-card'))");
report.checks.servicesMobileLayout = await layoutMetrics();
<<<<<<< ours
await evaluate("document.querySelector('.service-product-card').click()");
=======
await evaluate("document.querySelector('.service-product-card').focus(); document.querySelector('.service-product-card').click()");
>>>>>>> theirs
await waitFor("Boolean(document.querySelector('.service-detail-shell'))");
await wait(350);
await evaluate(`(() => {
  const modal = document.querySelector('.service-detail-shell');
  modal.scrollTop = modal.scrollHeight;
  modal.dispatchEvent(new Event('scroll', { bubbles: true }));
})()`);
await wait(250);
report.checks.serviceModalMobile = await evaluate(`(() => {
  const modal = document.querySelector('.service-detail-shell');
  const qr = document.querySelector('.service-detail-contact .qr-soft-frame');
  const contact = document.querySelector('.service-detail-contact');
  const qrRect = qr.getBoundingClientRect();
  const contactRect = contact.getBoundingClientRect();
  return {
    modalScrollable: modal.scrollHeight > modal.clientHeight,
    atBottom: Math.abs(modal.scrollHeight - modal.clientHeight - modal.scrollTop) < 3,
    qrVisible: qrRect.top >= 0 && qrRect.bottom <= innerHeight,
    contactVisible: contactRect.top >= 0 && contactRect.bottom <= innerHeight,
    qrSize: [Math.round(qrRect.width), Math.round(qrRect.height)],
    viewport: [innerWidth, innerHeight],
    overflowX: document.documentElement.scrollWidth > innerWidth + 1
  };
})()`);
report.screenshots.serviceModalEnMobile = await capture('service-modal-en-390x844.png');

<<<<<<< ours
<<<<<<< ours
=======
=======
>>>>>>> theirs
await send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
});
await setViewport(1440, 900);
await navigate('encyclopedia');
await waitFor("Boolean(document.querySelector('.encyclopedia-title'))");
const reducedTitleBefore = await evaluate("document.querySelector('.encyclopedia-title')?.textContent.trim()");
await wait(1800);
const reducedTitleAfter = await evaluate("document.querySelector('.encyclopedia-title')?.textContent.trim()");
report.checks.reducedMotion = {
  mediaMatches: await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"),
  titleBefore: reducedTitleBefore,
  titleAfter: reducedTitleAfter,
  titleStatic: reducedTitleBefore === reducedTitleAfter
};

<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
socket.close();
await fetch(`${debuggerOrigin}/json/close/${pageTarget.id}`);
console.log(JSON.stringify(report, null, 2));
