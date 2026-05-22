/* Arrival Board - plain JavaScript for old tablet compatibility */

/* Due date at local midnight (device local time). */
var DUE_DATE = new Date(2026, 11, 18, 0, 0, 0, 0);

var TICKER_PRIORITY_MESSAGE = "ARRIVAL WINDOW CLOSING. CONTINUE THE WORK.";
var RELOAD_STORAGE_KEY = "arrivalBoardLastReloadDate";
var MONTHLY_EVENT_STORAGE_KEY = "arrivalBoardLastMonthValue";

var tickerCategories = {
  father: [
    "PRESENCE COUNTS.",
    "YOUR CHILDREN ARE WATCHING.",
    "TEACH BY DEMONSTRATION.",
    "THE ORDINARY MOMENTS MATTER.",
    "BUILD THE LIFE THEY INHERIT.",
    "THEY WILL REMEMBER HOW YOU MADE THEM FEEL.",
    "ONE DAY THIS HOUSE WILL BE QUIET.",
    "READ THE STORY AGAIN.",
    "LISTEN LONGER.",
    "PUT DOWN THE PHONE.",
    "THE DAYS ARE LONG. THE YEARS ARE FAST.",
    "SMALL EYES LEARN BIG LESSONS.",
    "THEY DO NOT NEED PERFECTION.",
    "THEY NEED YOU."
  ],
  builder: [
    "SYSTEMS BEAT MOTIVATION.",
    "THE WORK IS THE WAY.",
    "STACK SMALL VICTORIES.",
    "BUILD WHAT LASTS.",
    "PROGRESS COMPOUNDS.",
    "START UGLY. REFINE LATER.",
    "FINISH BEFORE PERFECT.",
    "COMPLEXITY IS EARNED.",
    "ONE BRICK. THEN ANOTHER.",
    "FUTURE YOU IS WATCHING.",
    "MOMENTUM MATTERS.",
    "KEEP BUILDING.",
    "PROTECT THE MORNING HOURS.",
    "SMALL WORK BECOMES LARGE OUTCOMES.",
    "DO TODAY'S WORK TODAY."
  ],
  stoic: [
    "FOCUS ON WHAT YOU CONTROL.",
    "ENDURE AND BUILD.",
    "DO NOT BORROW TOMORROW'S SUFFERING.",
    "LET THE OBSTACLE TEACH.",
    "DISCIPLINE CREATES FREEDOM.",
    "BE UNMOVED BY NOISE.",
    "ATTENTION IS A WEAPON.",
    "CALM IS STRENGTH.",
    "PATIENCE BUILDS FOUNDATIONS.",
    "THE NEXT RIGHT STEP."
  ],
  humor: [
    "ADDITIONAL CREW MEMBER APPROACHING.",
    "TINY HUMAN DEPLOYMENT IMMINENT.",
    "FUTURE SNACK EXPENSES INCREASING.",
    "SLEEP WINDOW CLOSING.",
    "YOU ARE OUTNUMBERED.",
    "CAFFEINE LEVELS RECOMMENDED: HIGH.",
    "PATERNAL OPERATING CONDITIONS: VARIABLE.",
    "CHAOS PROBABILITY RISING.",
    "SMALL SOCK ANOMALY DETECTED.",
    "TINY SOCKS DETECTED. LOGIC UNAVAILABLE.",
    "THE CHILDREN YEARN FOR THE MINES.",
    "THE TINY OVERLORD APPROACHES.",
    "SUDDEN DINOSAUR QUESTIONS POSSIBLE.",
    "REMAIN CALM.",
    "TIME IS A FLAT CIRCLE.",
    "TACTICAL SNACK RESERVES ADVISED.",
    "UNIDENTIFIED STICKY SUBSTANCE POSSIBLE.",
    "CHAOS IS WITHIN ACCEPTABLE PARAMETERS.",
    "THE DAYS ARE FAST. THE NAPS ARE SHORT.",
    "FUTURE LEGO HAZARDS INCREASING.",
    "WASN'T IT MONDAY YESTERDAY?",
    "CURRENT STATUS: PERSIST.",
    "THE WORKSHOP REMAINS OPERATIONAL.",
    "ARRIVAL WINDOW APPROACHING."
  ],
  fitness: [
    "FINISH THE REP.",
    "DISCIPLINE OUTLIVES MOTIVATION.",
    "STRENGTH SERVES OTHERS.",
    "MOVE YOUR BODY.",
    "EARN YOUR REST.",
    "TEN MINUTES STILL COUNTS.",
    "YOU NEVER REGRET TRAINING.",
    "CONSISTENCY BEATS INTENSITY.",
    "BUILD CAPACITY.",
    "THE BODY CARRIES THE MISSION."
  ],
  operator: [
    "OPERATOR DISTRACTION DETECTED.",
    "PRIMARY OBJECTIVE HAS NOT MOVED.",
    "MANY THINGS FEEL URGENT. FEW ARE.",
    "FOCUS DRIFT OBSERVED.",
    "OPERATOR RESEARCHING SIDE QUESTS.",
    "RETURN TO PRIMARY OBJECTIVE.",
    "STANDARDS REMAIN.",
    "FACTORY STATUS: BUILDING.",
    "OPERATOR MAY REQUIRE CAFFEINE.",
    "UNAUTHORIZED SCOPE EXPANSION DETECTED.",
    "COMPLETE THE OBJECTIVE.",
    "REACQUIRE TARGET.",
    "HOLD THE LINE.",
    "ADAPT AND CONTINUE.",
    "MISSION CONTINUES.",
    "MAINTAIN STANDARDS.",
    "PRECISION MATTERS.",
    "SLOW IS SMOOTH. SMOOTH IS FAST."
  ]
};

var tickerWeights = {
  father: 30,
  builder: 25,
  stoic: 15,
  humor: 10,
  fitness: 10,
  operator: 10
};

var weightedCategoryPool = [];
var priorityQueue = [];
var lastDateKey = "";
var lastDisplayedMonthValue = null;
var reduceMotion = false;
var lightweightMode = false;
var lastArrivalsTapMs = 0;

var references = {};

function leftPadTwo(value) {
  var stringValue = String(value);
  if (stringValue.length < 2) {
    return "0" + stringValue;
  }
  return stringValue;
}

function hasClass(element, className) {
  var classText;
  if (!element) {
    return false;
  }
  if (element.classList && typeof element.classList.contains === "function") {
    return element.classList.contains(className);
  }
  classText = " " + element.className + " ";
  return classText.indexOf(" " + className + " ") > -1;
}

function addClass(element, className) {
  if (!element) {
    return;
  }
  if (element.classList && typeof element.classList.add === "function") {
    element.classList.add(className);
    return;
  }
  if (!hasClass(element, className)) {
    element.className = (element.className ? element.className + " " : "") + className;
  }
}

function removeClass(element, className) {
  var classText;
  if (!element) {
    return;
  }
  if (element.classList && typeof element.classList.remove === "function") {
    element.classList.remove(className);
    return;
  }
  classText = " " + element.className + " ";
  classText = classText.replace(" " + className + " ", " ");
  element.className = classText.replace(/^\s+|\s+$/g, "");
}

function setClassState(element, className, enabled) {
  if (enabled) {
    addClass(element, className);
  } else {
    removeClass(element, className);
  }
}

function buildWeightedCategoryPool() {
  var key;
  var i;

  weightedCategoryPool = [];
  for (key in tickerWeights) {
    if (Object.prototype.hasOwnProperty.call(tickerWeights, key)) {
      for (i = 0; i < tickerWeights[key]; i += 1) {
        weightedCategoryPool.push(key);
      }
    }
  }
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function formatDateKey(date) {
  var month = String(date.getMonth() + 1);
  var day = String(date.getDate());
  return date.getFullYear() + "-" + month + "-" + day;
}

function formatMonthDayCountdown(fromDate, toDate) {
  var cursor;
  var months = 0;
  var nextMonth;
  var msPerDay = 24 * 60 * 60 * 1000;
  var days;

  cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 0, 0, 0, 0);
  while (true) {
    nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate(), 0, 0, 0, 0);
    if (nextMonth <= toDate) {
      months += 1;
      cursor = nextMonth;
    } else {
      break;
    }
  }

  days = Math.floor((toDate.getTime() - cursor.getTime()) / msPerDay);
  if (days < 0) {
    days = 0;
  }

  return {
    months: months,
    days: days
  };
}

function pluralize(value, word) {
  return value + " " + word + (value === 1 ? "" : "S");
}

function formatClock(now) {
  var hours = now.getHours();
  var minutes = now.getMinutes();
  var seconds = now.getSeconds();
  var period = hours >= 12 ? "PM" : "AM";
  var h12 = hours % 12;
  if (h12 === 0) {
    h12 = 12;
  }
  return (
    leftPadTwo(h12) + ":" +
    leftPadTwo(minutes) + ":" +
    leftPadTwo(seconds) + " " + period
  );
}

function formatDateDisplay(now) {
  var weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  var months = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  return {
    date: months[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear(),
    weekday: weekdays[now.getDay()]
  };
}

function applyDayNightMode(now) {
  var hour = now.getHours();
  var isDay = hour >= 8 && hour < 20;

  setClassState(document.body, "day-mode", isDay);
  setClassState(document.body, "night-mode", !isDay);
}

function enqueuePriorityTicker(message) {
  priorityQueue.push(limitMessageLength(message));
}

function limitMessageLength(message) {
  if (message.length <= 48) {
    return message;
  }
  return message.slice(0, 45).trim() + "...";
}

function randomFromArray(array) {
  var index = Math.floor(Math.random() * array.length);
  return array[index];
}

function chooseTickerMessage() {
  var category;
  var messages;

  if (priorityQueue.length > 0) {
    return priorityQueue.shift();
  }

  category = randomFromArray(weightedCategoryPool);
  messages = tickerCategories[category];
  return limitMessageLength(randomFromArray(messages));
}

function setTickerMessage(message) {
  references.tickerText.textContent = ">> " + message + " <<";

  if (!reduceMotion && !lightweightMode) {
    references.tickerTrack.style.animation = "none";
    references.tickerTrack.offsetHeight; /* Reflow restarts animation safely. */
    references.tickerTrack.style.animation = "";
  }
}

function rotateTickerMessage() {
  setTickerMessage(chooseTickerMessage());
}

function attemptFullscreen() {
  var element = document.documentElement;
  var request =
    element.requestFullscreen ||
    element.webkitRequestFullscreen ||
    element.webkitRequestFullScreen ||
    element.mozRequestFullScreen ||
    element.msRequestFullscreen ||
    element.msRequestFullScreen;

  if (typeof request === "function") {
    try {
      request.call(element);
    } catch (error) {
      /* Graceful fallback: continue without fullscreen. */
    }
  }
}

function isFullscreenActive() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.webkitCurrentFullScreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

function exitFullscreenIfPossible() {
  var exit =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.webkitCancelFullScreen ||
    document.mozCancelFullScreen ||
    document.msExitFullscreen;

  if (typeof exit === "function") {
    try {
      exit.call(document);
    } catch (error) {
      /* Graceful fallback: remain in current display mode. */
    }
  }
}

function handleArrivalsTap() {
  var nowMs = new Date().getTime();
  var isDoubleTap = (nowMs - lastArrivalsTapMs) <= 450;

  if (!isFullscreenActive()) {
    attemptFullscreen();
    lastArrivalsTapMs = nowMs;
    return;
  }

  if (isDoubleTap) {
    exitFullscreenIfPossible();
    lastArrivalsTapMs = 0;
    return;
  }

  lastArrivalsTapMs = nowMs;
}

function runNightlyReloadCheck(now) {
  var todayKey = formatDateKey(now);
  var hour = now.getHours();
  var lastReloadDay = "";

  try {
    lastReloadDay = localStorage.getItem(RELOAD_STORAGE_KEY) || "";
  } catch (error) {
    return;
  }

  if (hour >= 3 && lastReloadDay !== todayKey) {
    try {
      localStorage.setItem(RELOAD_STORAGE_KEY, todayKey);
    } catch (writeError) {
      return;
    }
    window.location.reload();
  }
}

function triggerFlipAnimation(className, durationMs) {
  removeClass(references.etaBoard, "flip-daily");
  removeClass(references.etaBoard, "flip-monthly");
  references.etaBoard.offsetHeight;
  addClass(references.etaBoard, className);

  window.setTimeout(function () {
    removeClass(references.etaBoard, className);
  }, durationMs);
}

function updateCountdownAndPanels() {
  var now = new Date();
  var dueAt = startOfLocalDay(DUE_DATE);
  var today = startOfLocalDay(now);
  var msPerDay = 24 * 60 * 60 * 1000;
  var floorDaysRemaining = Math.floor((dueAt.getTime() - today.getTime()) / msPerDay);
  var dateKey = formatDateKey(today);
  var dateParts = formatDateDisplay(now);
  var countdown;
  var storedMonthlyKey;

  applyDayNightMode(now);

  references.timeValue.textContent = formatClock(now);
  references.dateValue.textContent = dateParts.date;
  references.weekdayValue.textContent = dateParts.weekday;

  if (floorDaysRemaining <= 0) {
    references.etaValue.textContent = "ARRIVED";
    references.etaStatus.textContent = "ARRIVED";
    references.daysValue.textContent = "0";
    lastDisplayedMonthValue = 0;
  } else {
    countdown = formatMonthDayCountdown(today, dueAt);
    references.etaValue.textContent =
      pluralize(countdown.months, "MONTH") + " " + pluralize(countdown.days, "DAY");
    references.etaStatus.textContent = "EN ROUTE";
    references.daysValue.textContent = String(floorDaysRemaining);

    if (lastDisplayedMonthValue !== null && countdown.months !== lastDisplayedMonthValue) {
      enqueuePriorityTicker(TICKER_PRIORITY_MESSAGE);
      if (!reduceMotion) {
        triggerFlipAnimation("flip-monthly", 1400);
      }
    }

    storedMonthlyKey = String(countdown.months);
    try {
      localStorage.setItem(MONTHLY_EVENT_STORAGE_KEY, storedMonthlyKey);
    } catch (error) {
      /* Ignore storage failure and continue display updates. */
    }

    lastDisplayedMonthValue = countdown.months;
  }

  if (dateKey !== lastDateKey) {
    if (lastDateKey && !reduceMotion) {
      triggerFlipAnimation("flip-daily", 1100);
    }
    lastDateKey = dateKey;
  }

  runNightlyReloadCheck(now);
}

function initializeMotionPreferences() {
  var mediaQuery;
  try {
    mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotion = !!mediaQuery.matches;
    if (reduceMotion) {
      addClass(document.body, "reduced-motion");
    }
  } catch (error) {
    reduceMotion = false;
  }
}

function detectLegacyDeviceForLighterAnimations() {
  var userAgent = "";
  var androidVersion = null;
  var match = null;
  var hardwareConcurrency = window.navigator && window.navigator.hardwareConcurrency;
  var deviceMemory = window.navigator && window.navigator.deviceMemory;

  try {
    userAgent = (window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : "";
  } catch (error) {
    userAgent = "";
  }

  match = /Android\s([0-9]+)/i.exec(userAgent);
  if (match && match[1]) {
    androidVersion = Number(match[1]);
  }

  if ((androidVersion !== null && androidVersion <= 5) ||
      (typeof hardwareConcurrency === "number" && hardwareConcurrency > 0 && hardwareConcurrency <= 2) ||
      (typeof deviceMemory === "number" && deviceMemory > 0 && deviceMemory <= 2)) {
    lightweightMode = true;
    addClass(document.body, "lightweight-mode");
  }
}

function wireDomReferences() {
  references.arrivalsTrigger = document.getElementById("arrivalsTrigger");
  references.boardHeader = document.getElementById("boardHeader");
  references.etaBoard = document.getElementById("etaBoard");
  references.etaValue = document.getElementById("etaValue");
  references.etaStatus = document.getElementById("etaStatus");
  references.timeValue = document.getElementById("timeValue");
  references.dateValue = document.getElementById("dateValue");
  references.weekdayValue = document.getElementById("weekdayValue");
  references.daysValue = document.getElementById("daysValue");
  references.tickerTrack = document.getElementById("tickerTrack");
  references.tickerText = document.getElementById("tickerText");
  references.boardDriftLayer = document.getElementById("boardDriftLayer");
}

function startTickerRotation() {
  var interval;
  if (reduceMotion) {
    interval = 24000;
  } else if (lightweightMode) {
    interval = 22000;
  } else {
    interval = 16000;
  }
  rotateTickerMessage();
  window.setInterval(rotateTickerMessage, interval);
}

function initializeMonthlyReference() {
  var storedValue = null;
  try {
    storedValue = localStorage.getItem(MONTHLY_EVENT_STORAGE_KEY);
  } catch (error) {
    storedValue = null;
  }

  if (storedValue !== null && storedValue !== "") {
    lastDisplayedMonthValue = Number(storedValue);
    if (isNaN(lastDisplayedMonthValue)) {
      lastDisplayedMonthValue = null;
    }
  }
}

function init() {
  wireDomReferences();
  initializeMotionPreferences();
  detectLegacyDeviceForLighterAnimations();
  buildWeightedCategoryPool();
  initializeMonthlyReference();

  references.arrivalsTrigger.addEventListener("click", handleArrivalsTap);
  references.boardHeader.addEventListener("click", function () {
    if (!isFullscreenActive()) {
      attemptFullscreen();
    }
  });
  references.boardDriftLayer.addEventListener("click", function () {
    if (!isFullscreenActive()) {
      attemptFullscreen();
    }
  });
  if (!lightweightMode) {
    addClass(references.tickerText, "display-glow");
    addClass(references.etaValue, "display-glow");
  }

  updateCountdownAndPanels();
  window.setInterval(updateCountdownAndPanels, 1000);

  startTickerRotation();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
