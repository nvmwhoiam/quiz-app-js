export function setClosedToOpen(selector) {
    selector.setAttribute("data-state", "open");
}

export function setClosingToClosed(selector) {
    selector.setAttribute("data-state", "closing");

    selector.addEventListener("animationend", function () {
        selector.setAttribute("data-state", "closed");
    }, { once: true });
}