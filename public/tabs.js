const TAB_BUTTONS = Array.from(document.querySelectorAll(".tab-nav__button[data-tab-target]"));
const TAB_PANELS = Array.from(document.querySelectorAll(".tab-content[data-tab-panel]"));
const DEFAULT_TAB = "library";

function getTabFromHash() {
  const hashValue = window.location.hash.replace(/^#/, "").trim();
  const validTab = TAB_BUTTONS.find((button) => button.dataset.tabTarget === hashValue)?.dataset.tabTarget;
  return validTab || DEFAULT_TAB;
}

function activateTab(tabName) {
  for (const button of TAB_BUTTONS) {
    const isActive = button.dataset.tabTarget === tabName;
    button.classList.toggle("tab-nav__button--active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  }

  for (const panel of TAB_PANELS) {
    const isActive = panel.dataset.tabPanel === tabName;
    panel.classList.toggle("tab-content--active", isActive);
    panel.hidden = !isActive;
  }
}

function setTab(tabName) {
  const nextTab = TAB_BUTTONS.find((button) => button.dataset.tabTarget === tabName)?.dataset.tabTarget || DEFAULT_TAB;

  if (window.location.hash.replace(/^#/, "") !== nextTab) {
    window.location.hash = nextTab;
    return;
  }

  activateTab(nextTab);
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
  activateTab(getTabFromHash());
});

activateTab(getTabFromHash());
