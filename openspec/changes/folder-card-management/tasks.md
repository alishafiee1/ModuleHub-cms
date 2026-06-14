## 1. Card description and folder gear (MVP UI)

- [ ] 1.1 Add `cardDescription` to `LayoutTreeNode` in `types.ts` and `docs/site-layout.json` sample
- [ ] 1.2 Render `card-desc` for folders; modules use `cardDescription ?? changelog` in `modulehub-card-store.js`
- [ ] 1.3 Add `line-clamp` (max 2 lines) on `.card-desc` in `style.css`
- [ ] 1.4 Extend `shouldShowGearForCard` for `folder` + Super Admin; hide in edit mode
- [ ] 1.5 Wire folder ⚙ click in `card-canvas-app.js` with `stopPropagation` (no navigate)

## 2. Folder tree API

- [ ] 2.1 Create `folder-management.ts`: `renameFolder`, `moveFolder`, `deleteFolder`, `isDescendant`
- [ ] 2.2 Implement `PATCH /admin/folder/:folderId` (name, cardDescription, parentId)
- [ ] 2.3 Implement `DELETE /admin/folder/:folderId` with four `contentPolicy` values
- [ ] 2.4 Reuse module-delete service for cascade-delete (stop running modules first)
- [ ] 2.5 Unit tests: nested tree, cycle prevention, root rules
- [ ] 2.6 API tests: PATCH rename; DELETE `reject-if-not-empty` → 409

## 3. Folder gear dialog and UX

- [ ] 3.1 Add `showFolderGearDialog` and edit-meta form in `dialog.js`
- [ ] 3.2 Tree picker for move from layout cache
- [ ] 3.3 Delete wizard with content policies + cascade name confirmation
- [ ] 3.4 `script.js`: `openFolderGearMenu`, `handleFolderGearAction`, refresh on success
- [ ] 3.5 Redirect when `?folder=` references deleted folder
- [ ] 3.6 Module gear settings: «توضیح کارت» field separate from changelog
- [ ] 3.7 E2E E2E-FCM-01: edit folder name and description
- [ ] 3.8 E2E E2E-FCM-02: move folder via gear
- [ ] 3.9 E2E E2E-FCM-03: delete with content policies
- [ ] 3.10 Verify `docs/change/folder-card-management/behavior.md` and `docs/ui-behavior.md` §2.5 stay aligned

## 4. Static card template (phase 2)

- [ ] 4.1 Document `cardPresentation` in `docs/module-hosting-guide.md`
- [ ] 4.2 Manifest schema validation for `static-template` and `layoutLocked`
- [ ] 4.3 Render sandboxed iframe in `createCardElement` when mode is `static-template`
- [ ] 4.4 Disable drag/resize in edit mode for `layoutLocked` cards
- [ ] 4.5 Server validation: reject grid PATCH for locked nodes
- [ ] 4.6 Demo module fixture with `assets/card.html`
- [ ] 4.7 E2E: static card has no resize handle; canvas scroll remains smooth

## 5. Close-out

- [ ] 5.1 Update `docs/tasks.md` phase 7.9 when phases 1–3 complete
- [ ] 5.2 Run `npm test`, `npm run lint`, `npm run test:e2e` for FCM specs
- [ ] 5.3 Archive change with `/opsx:archive` after deploy verification
