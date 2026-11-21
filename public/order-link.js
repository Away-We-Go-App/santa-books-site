(() => {
  const openButton = document.querySelector("#open-santa-books");
  const status = document.querySelector("#order-status");
  if (!(openButton instanceof HTMLAnchorElement) || !(status instanceof HTMLElement)) return;

  const purchaseID = window.location.hash.slice(1);
  const isPurchaseID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(purchaseID);
  const destination = isPurchaseID
    ? `santabooks://orders/${purchaseID.toLowerCase()}`
    : "santabooks://orders";

  openButton.href = destination;
  if (!isPurchaseID) {
    status.textContent = "Open Santa Books to view your orders.";
    return;
  }

  // Keep a visible, tappable fallback in case the browser blocks automatic app opening.
  window.setTimeout(() => window.location.assign(destination), 80);
})();
