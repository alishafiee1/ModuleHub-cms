/**
 * card-transfer.js — drag-to-reparent folders/modules in edit mode
 * Dwell on target folder/back-card, shrink source, confirm with green tick.
 */

export const TRANSFER_DWELL_MS = 2000;
export const TRANSFER_DWELL_MS_REDUCED = 500;

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
    this.dwellRing = null;
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
    this.showDwellRing(target.element);

    this.dwellTimer = window.setTimeout(() => {
      this.transferReady = true;
      this.sourceElement?.classList.add('is-transfer-ready');
    }, this.getDwellMs());
  }

  /**
   * showDwellRing --- progress ring on target during dwell ---
   * @param {HTMLElement} targetElement
   */
  showDwellRing(targetElement) {
    this.removeDwellRing();
    const ring = document.createElement('div');
    ring.className = 'transfer-dwell-ring';
    ring.style.setProperty('--dwell-duration', `${this.getDwellMs()}ms`);
    targetElement.appendChild(ring);
    this.dwellRing = ring;
    requestAnimationFrame(() => ring.classList.add('is-active'));
  }

  removeDwellRing() {
    if (this.dwellRing) {
      this.dwellRing.remove();
      this.dwellRing = null;
    }
  }

  resetDwell() {
    if (this.dwellTimer !== null) {
      clearTimeout(this.dwellTimer);
      this.dwellTimer = null;
    }
    if (this.dwellTarget) {
      this.dwellTarget.classList.remove('is-transfer-target');
      this.dwellTarget = null;
    }
    this.targetParentId = null;
    this.transferReady = false;
    this.sourceElement?.classList.remove('is-transfer-ready');
    this.removeDwellRing();
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

    this.resetDwell();
    this.sourceElement?.classList.remove('is-dragging', 'snap-preview');

    if (!wasReady || !parentId || !nodeId || !nodeType) {
      this.clearSource();
      return false;
    }

    restorePosition();
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
    this.dismissConfirm(false);

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
      this.dismissConfirm(false);
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
    if (this.confirmButton) {
      this.confirmButton.remove();
      this.confirmButton = null;
    }
    if (this.confirmBackdrop) {
      this.confirmBackdrop.remove();
      this.confirmBackdrop = null;
    }
    if (restore && this.onCancelRestore) {
      this.onCancelRestore();
    }
    this.onCancelRestore = null;
    this.onDismiss?.();
  }

  isConfirmOpen() {
    return Boolean(this.confirmButton);
  }
}
