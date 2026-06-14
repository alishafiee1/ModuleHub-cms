## ADDED Requirements

### Requirement: Static card presentation manifest
Module `module.json` SHALL support optional `cardPresentation` with `mode: "static-template"`, `templatePath`, `sandbox: "iframe"`, and `layoutLocked: true` by default for static mode.

#### Scenario: Wizard accepts static template manifest
- **WHEN** module manifest declares valid `cardPresentation.static-template` with existing template file path
- **THEN** module upload wizard validation passes

#### Scenario: Invalid template path rejected
- **WHEN** `templatePath` does not exist in module bundle
- **THEN** validation fails with a clear error

### Requirement: Static template rendering
When `cardPresentation.mode` is `static-template`, the home canvas SHALL render the template file inside a sandboxed iframe without scripts instead of default icon/title layout.

#### Scenario: Iframe renders template
- **WHEN** module card with static-template mode is displayed
- **THEN** card body shows iframe content from module assets path and default icon/title chrome is replaced or hidden per design

#### Scenario: No script execution
- **WHEN** static template HTML contains script tags
- **THEN** iframe sandbox prevents script execution

### Requirement: Layout lock for static template cards
Cards with `layoutLocked: true` SHALL NOT be draggable or resizable in layout edit mode. Server SHALL reject PATCH attempts that change grid position or size for locked nodes.

#### Scenario: No resize handle in edit mode
- **WHEN** Super Admin enters layout edit mode on a static-template card
- **THEN** drag and resize handles are not shown for that card

#### Scenario: Server rejects grid change
- **WHEN** client PATCHes new `col`/`row`/`colSpan`/`rowSpan` for a layout-locked node
- **THEN** server responds with HTTP 400 and layout file is unchanged
