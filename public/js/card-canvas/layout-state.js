/**
 * وضعیت تعامل کاربر با گرید
 * Guards layout refresh while pointer drag/resize or canvas height drag is active.
 */
let interacting = false;
let resizingCanvas = false;

/** @param {boolean} value */
export function setInteracting(value) {
  interacting = value;
}

export function isInteracting() {
  return interacting;
}

/** @param {boolean} value */
export function setResizingCanvas(value) {
  resizingCanvas = value;
}

export function isResizingCanvas() {
  return resizingCanvas;
}
