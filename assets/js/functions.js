export function setClosedToOpen(selector) {
    selector.setAttribute("data-state", "open");
    selector.setAttribute("aria-expanded", true);
}

export function setClosingToClosed(selector) {
    selector.setAttribute("data-state", "closing");
    selector.setAttribute("aria-expanded", false);

    selector.addEventListener("animationend", function () {
        selector.setAttribute("data-state", "closed");
    }, { once: true });
}