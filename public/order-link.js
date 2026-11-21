(async () => {
  window.addEventListener("hashchange", () => window.location.reload());
  const status = document.querySelector("#order-status");
  const heading = document.querySelector("#order-heading");
  const fallback = document.querySelector("#order-fallback");
  const fragment = window.location.hash.slice(1);
  const hasOrder = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(fragment);
  const purchaseID = hasOrder ? fragment.toLowerCase() : "";
  if (hasOrder) {
    const reference = document.querySelector("#order-reference");
    reference.textContent = "Order " + purchaseID.slice(0, 8).toUpperCase();
    reference.hidden = false;
  }

  // iPadOS can identify as a Mac when requesting the desktop version.
  const isAppleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isAppleMobile) {
    const button = document.querySelector("#open-santa-books");
    button.href = hasOrder ? "santabooks://orders/" + purchaseID : "santabooks://orders";
    button.hidden = false;
    status.textContent = "Use the account you ordered with to see your order details.";
    fallback.hidden = false;
    if (hasOrder) window.setTimeout(() => window.location.assign(button.href), 80);
    return;
  }

  // A QR code on an Android phone cannot be scanned using that same device.
  if (/Android|Mobile/i.test(navigator.userAgent)) return;

  const handoff = new URL("/orders/", window.location.origin);
  handoff.hash = purchaseID;
  try {
    const { generate } = await import("./vendor/lean-qr-2.7.4.mjs");
    const qr = document.querySelector("#order-qr");
    generate(handoff.href).toCanvas(qr);
    heading.textContent = "Open in Santa Books";
    status.textContent = "Scan this code with your iPhone or iPad camera.";
    qr.hidden = false;
    fallback.hidden = false;
  } catch {
    // The original instructions and support link work without the QR renderer.
  }
})();
