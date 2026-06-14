/**
 * card-transfer.js — drag-to-reparent folders/modules in edit mode
 * Dwell on target folder/back-card, shrink source, confirm with green tick.
 */

export const TRANSFER_DWELL_MS = 500;
export const TRANSFER_DWELL_MS_REDUCED = 125;
export const TRANSFER_TARGET_PULSE_MS = 1000;

/**
 * CardTransferController --- manages dwell, visuals, and confirm button ---
 */
export class CardTransferController {
  /**
   * @param {object} options
   * @param {() => boolean} options.isReducedMotion
   * @param {() => { parentFolderId?: string } | null} options.getBackInfo
   * @param {(payload: object) => void} options.onConfirm
   * @param {() => void} [options.onDismiss]
   */
  constructor(options) {
    this.isReducedMotion = options.isReducedMotion;
    this.getBackInfo = options.getBackInfo;
    this.onConfirm = options.onConfirm;
    this.onDismiss = options.onDismiss;

    /** @type {number|null} */
    this.dwellTimer = null;
    /** @type {HTMLElement|null} */
    this.dwellTarget = null;
    /** @type {string|null} */
    this.targetParentId = null;
    /** @type {boolean} */
    this.transferReady = false;
    /** @type {HTMLElement|null} */
    this.sourceElement = null;
    /** @type {string|null} */
    this.sourceNodeId = null;
    /** @type {string|null} */
    this.sourceNodeType = null;
    /** @type {HTMLElement|null} */
    this.pendingSourceElement = null;
    /** @type {HTMLElement|null} */
    this.confirmButton = null;
    /** @type {HTMLElement|null} */
    this.confirmBackdrop = null;
    /** @type {(() => void)|null} */
    this.onCancelRestore = null;
  }

  getDwellMs() {
    return this.isReducedMotion() ? TRANSFER_DWELL_MS_REDUCED : TRANSFER_DWELL_MS;
  }

  /**
   * beginDrag --- track source card for potential transfer ---
   */
  beginDrag(element) {
    this.resetDwell();
    this.transferReady = false;
    this.sourceElement = element;
    this.sourceNodeId = element.dataset.id || null;
    this.sourceNodeType = element.dataset.type || null;
  }

  /**
   * resolveDropTarget --- folder card or back-card under pointer ---
   * @param {number} clientX
   * @param {number} clientY
   * @returns {{ element: HTMLElement, parentId: string } | null}
   */
  resolveDropTarget(clientX, clientY) {
    if (!this.sourceElement || !this.sourceNodeId) {
      return null;
    }

    const previousPointerEvents = this.sourceElement.style.pointerEvents;
    this.sourceElement.style.pointerEvents = 'none';
    const hitElements = document.elementsFromPoint(clientX, clientY);
    this.sourceElement.style.pointerEvents = previousPointerEvents;
    for (const hit of hitElements) {
      if (!(hit instanceof HTMLElement)) {
        continue;
      }
      const folderCard = hit.closest('.folder-card.card-canvas-item');
      if (folderCard && folderCard !== this.sourceElement) {
        const folderId = folderCard.getAttribute('data-id');
        if (folderId && folderId !== this.sourceNodeId) {
          return { element: folderCard, parentId: folderId };
        }
      }

      const backCard = hit.closest('.back-card.card-canvas-item');
      if (backCard) {
        const backInfo = this.getBackInfo();
        const parentId = backInfo?.parentFolderId;
        if (parentId) {
          return { element: backCard, parentId };
        }
      }
    }
    return null;
  }

  /**
   * triggerTargetPulse --- short zoom pulse on transfer target ---
   * @param {HTMLElement} targetElement
   */
  triggerTargetPulse(targetElement) {
    targetElement.classList.remove('is-transfer-target-pulse');
    void targetElement.offsetWidth;
    targetElement.classList.add('is-transfer-target-pulse');
  }

  /**
   * updateHover --- call on pointermove during drag ---
   */
  updateHover(clientX, clientY) {
    const target = this.resolveDropTarget(clientX, clientY);
    if (!target) {
      this.resetDwell();
      return;
    }

    if (this.dwellTarget === target.element && this.targetParentId === target.parentId) {
      return;
    }

    this.resetDwell();
    this.dwellTarget = target.element;
    this.targetParentId = target.parentId;
    this.dwellTarget.classList.add('is-transfer-target');

    this.dwellTimer = window.setTimeout(() => {
      this.transferReady = true;
      this.sourceElement?.classList.add('is-transfer-ready');
      if (this.dwellTarget) {
        this.triggerTargetPulse(this.dwellTarget);
      }
    }, this.getDwellMs());
  }

  /**
   * resetDwellTimers --- clear dwell timer and ready flag ---
   */
  resetDwellTimers() {
    if (this.dwellTimer !== null) {
      clearTimeout(this.dwellTimer);
      this.dwellTimer = null;
    }
    this.targetParentId = null;
    this.transferReady = false;
  }

  /**
   * resetDwellTarget --- clear target highlight and pulse ---
   */
  resetDwellTarget() {
    if (this.dwellTarget) {
      this.dwellTarget.classList.remove('is-transfer-target', 'is-transfer-target-pulse');
      this.dwellTarget = null;
    }
  }

  /**
   * resetDwell --- full reset during active drag ---
   */
  resetDwell() {
    this.resetDwellTimers();
    this.resetDwellTarget();
    this.sourceElement?.classList.remove('is-transfer-ready');
  }

  /**
   * teardownConfirmUi --- remove tick button and backdrop only ---
   */
  teardownConfirmUi() {
    if (this.confirmButton) {
      this.confirmButton.remove();
      this.confirmButton = null;
    }
    if (this.confirmBackdrop) {
      this.confirmBackdrop.remove();
      this.confirmBackdrop = null;
    }
  }

  /**
   * cancelPendingTransfer --- restore or clear pending card state ---
   * @param {boolean} restore
   */
  cancelPendingTransfer(restore) {
    if (this.pendingSourceElement) {
      this.pendingSourceElement.classList.remove('is-transfer-ready');
      if (restore && this.onCancelRestore) {
        this.onCancelRestore();
      }
      this.pendingSourceElement = null;
    } else if (restore && this.onCancelRestore) {
      this.onCancelRestore();
    }
    this.onCancelRestore = null;
  }

  /**
   * completePendingTransfer --- confirm path: drop UI without grid restore ---
   */
  completePendingTransfer() {
    this.teardownConfirmUi();
    if (this.pendingSourceElement) {
      this.pendingSourceElement.classList.remove('is-transfer-ready');
      this.pendingSourceElement = null;
    }
    this.onCancelRestore = null;
  }

  /**
   * endDrag --- returns true if transfer confirm UI was shown (skip grid settle) ---
   * @param {number} clientX
   * @param {number} clientY
   * @param {() => void} restorePosition
   */
  endDrag(clientX, clientY, restorePosition) {
    const wasReady = this.transferReady;
    const parentId = this.targetParentId;
    const nodeId = this.sourceNodeId;
    const nodeType = this.sourceNodeType;
    const sourceEl = this.sourceElement;

    this.resetDwellTarget();
    this.resetDwellTimers();
    sourceEl?.classList.remove('is-dragging', 'snap-preview');

    if (!wasReady || !parentId || !nodeId || !nodeType || !sourceEl) {
      sourceEl?.classList.remove('is-transfer-ready');
      this.clearSource();
      return false;
    }

    this.pendingSourceElement = sourceEl;
    this.onCancelRestore = restorePosition;
    this.showConfirmButton(clientX, clientY, {
      nodeId,
      nodeType,
      targetParentId: parentId,
    });
    this.clearSource();
    return true;
  }

  clearSource() {
    this.sourceElement = null;
    this.sourceNodeId = null;
    this.sourceNodeType = null;
  }

  /**
   * showConfirmButton --- green tick at release point ---
   */
  showConfirmButton(clientX, clientY, payload) {
    this.teardownConfirmUi();

    const backdrop = document.createElement('div');
    backdrop.className = 'transfer-confirm-backdrop';
    backdrop.addEventListener('click', () => this.dismissConfirm(true));

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'transfer-confirm-btn';
    button.title = 'تأیید انتقال';
    button.setAttribute('aria-label', 'تأیید انتقال');
    button.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i>';
    button.style.left = `${Math.round(clientX - 22)}px`;
    button.style.top = `${Math.round(clientY - 22)}px`;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      this.completePendingTransfer();
      this.onConfirm(payload);
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(button);
    this.confirmBackdrop = backdrop;
    this.confirmButton = button;

    requestAnimationFrame(() => {
      backdrop.classList.add('is-open');
      button.classList.add('is-open');
    });
  }

  /**
   * dismissConfirm --- hide tick; optionally restore card position ---
   * @param {boolean} restore
   */
  dismissConfirm(restore) {
    this.teardownConfirmUi();
    this.cancelPendingTransfer(restore);
    this.onDismiss?.();
  }

  isConfirmOpen() {
    return Boolean(this.confirmButton);
  }
}
