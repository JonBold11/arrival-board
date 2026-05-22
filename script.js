/* Arrival Board - plain JavaScript for old tablet compatibility */

/* Due date at local midnight (device local time). */
var DUE_DATE = new Date(2027, 0, 24, 0, 0, 0, 0);

var TICKER_PRIORITY_MESSAGE = "ARRIVAL WINDOW CLOSING. CONTINUE THE WORK.";
var RELOAD_STORAGE_KEY = "arrivalBoardLastReloadDate";
var MONTHLY_EVENT_STORAGE_KEY = "arrivalBoardLastMonthValue";

var tickerCategories = {
  pressure: [
    "THE WORK IS THE WAY.",
    "HOLD THE LINE.",
    "BUILD BEFORE ARRIVAL.",
    "FOUNDATION PHASE ACTIVE.",
    "PRESSURE CREATES SHAPE.",
    "FUTURE YOU IS WATCHING.",
    "COMPETENCE COMPOUNDS.",
    "SMALL PROGRESS DAILY.",
    "DISCIPLINE BECOMES FREEDOM.",
    "THE WINDOW IS CLOSING.",
    "ARRIVAL WINDOW APPROACHING."
    ,
    "MAKE TODAY COUNT.",
    "BUILD WHAT THEY INHERIT.",
    "TEACH BY DEMONSTRATION.",
    "PRESENCE IS WORK.",
    "FATHERHOOD IS PRACTICE.",
    "STRUCTURE BEFORE CHAOS.",
    "PREPARE THE FOUNDATION.",
    "DO THE NEXT RIGHT THING.",
    "THE DAYS ARE MOVING.",
    "TIME WILL NOT WAIT.",
    "USE THE MORNING.",
    "PROTECT THE HOURS.",
    "STACK THE BRICKS.",
    "NO DRAMA. JUST WORK.",
    "QUIET WORK BUILDS LOUD RESULTS.",
    "THE STANDARD REMAINS.",
    "RETURN TO THE WORK.",
    "TODAY HAS WEIGHT.",
    "BUILD THE LIFE THEY ENTER.",
    "DO NOT WASTE THE COUNTDOWN.",
    "THIS IS THE PREPARATION PHASE.",
    "RESPONSIBILITY IS A PRIVILEGE.",
    "MOVE WITH PURPOSE.",
    "ONE DAY CLOSER.",
    "THE PRESSURE IS THE POINT.",
    "MAKE ROOM FOR THE FUTURE.",
    "SYSTEM STATUS: BUILDING.",
    "MISSION STATUS: BUILDING.",
    "CONTINUE THE WORK.",
    "SEE IT CLEARLY.",
    "THE WORK FEEDS TOMORROW."
  ]
};

var tickerWeights = {
  pressure: 100
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
