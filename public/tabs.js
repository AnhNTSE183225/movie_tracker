const TAB_BUTTONS = Array.from(document.querySelectorAll(".tab-nav__button[data-tab-target]"));
const TAB_PANELS = Array.from(document.querySelectorAll(".tab-content[data-tab-panel]"));
const TAB_NAV = document.querySelector(".tab-nav");
const TAB_INDICATOR = document.querySelector(".tab-nav__indicator");
const DEFAULT_TAB = "library";
const TAB_CHANGE_EVENT = "dashboard:tabchange";

function getTabFromHash() {
  const hashValue = window.location.hash.replace(/^#/, "").trim();
  const validTab = TAB_BUTTONS.find((button) => button.dataset.tabTarget === hashValue)?.dataset.tabTarget;
  return validTab || DEFAULT_TAB;
}

function applyTab(tabName) {
  for (const button of TAB_BUTTONS) {
    const isActive = button.dataset.tabTarget === tabName;
    button.classList.toggle("tab-nav__button--active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  }

  for (const panel of TAB_PANELS) {
    const isActive = panel.dataset.tabPanel === tabName;
    panel.classList.toggle("tab-content--active", isActive);
    panel.hidden = !isActive;
    panel.style.viewTransitionName = isActive ? "tab-panel" : "none";
  }

  window.dispatchEvent(new CustomEvent(TAB_CHANGE_EVENT, {
    detail: { tabName },
  }));
}

function updateTabIndicator(tabName) {
  if (!TAB_NAV || !TAB_INDICATOR) {
    return;
  }

  const activeButton = TAB_BUTTONS.find((button) => button.dataset.tabTarget === tabName);
  if (!activeButton) {
    return;
  }

  const navRect = TAB_NAV.getBoundingClientRect();
  const buttonRect = activeButton.getBoundingClientRect();
  const navStyles = window.getComputedStyle(TAB_NAV);
  const leftInset = Number.parseFloat(navStyles.borderLeftWidth) + Number.parseFloat(navStyles.paddingLeft);
  const leftOffset = buttonRect.left - navRect.left - leftInset;

  TAB_INDICATOR.style.width = `${buttonRect.width}px`;
  TAB_INDICATOR.style.transform = `translateX(${leftOffset}px)`;
}

function activateTab(tabName, animate = true) {
  if (animate && document.startViewTransition) {
    document.startViewTransition(() => {
      applyTab(tabName);
    });
    return;
  }

  applyTab(tabName);
}

function syncTabState(tabName, animate = true) {
  activateTab(tabName, animate);
  updateTabIndicator(tabName);
}

function setTab(tabName) {
  const nextTab = TAB_BUTTONS.find((button) => button.dataset.tabTarget === tabName)?.dataset.tabTarget || DEFAULT_TAB;

  if (window.location.hash.replace(/^#/, "") !== nextTab) {
    window.location.hash = nextTab;
    return;
  }

  syncTabState(nextTab);
}

for (const button of TAB_BUTTONS) {
  button.addEventListener("click", () => {
    const target = button.dataset.tabTarget;
    if (target) {
      setTab(target);
    }
  });
}

window.addEventListener("hashchange", () => {
  syncTabState(getTabFromHash());
});

function initializeTabs() {
  const initialTab = getTabFromHash();
  syncTabState(initialTab, false);

  requestAnimationFrame(() => {
    TAB_NAV?.classList.add("tab-nav--ready");
  });
}

if (document.readyState === "loading") {
  window.addEventListener("load", initializeTabs, { once: true });
} else {
  initializeTabs();
}

window.addEventListener("resize", () => {
  updateTabIndicator(getTabFromHash());
});
