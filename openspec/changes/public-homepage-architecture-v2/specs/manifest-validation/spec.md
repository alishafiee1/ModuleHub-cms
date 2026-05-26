## ADDED Requirements

### Requirement: Standalone manifest requires index.html on disk

Validation for `type: standalone` SHALL verify `index.html` exists in the extracted or staged module directory.

#### Scenario: Post-extract validation passes

- **WHEN** a standalone module is extracted and contains `index.html`
- **THEN** validation SHALL succeed

#### Scenario: Post-extract validation fails

- **WHEN** a standalone module is extracted without `index.html`
- **THEN** validation SHALL fail and the module SHALL NOT be registered

### Requirement: Built-in module type in schema

The manifest schema SHALL accept `type: builtin` for modules shipped inside core.

#### Scenario: Built-in manifest valid

- **WHEN** a built-in module manifest has `type: builtin` and no docker section
- **THEN** validation SHALL pass

## MODIFIED Requirements

### Requirement: Module type enum

The system SHALL support module types `builtin` and `standalone` in the registry and manifest validator.

#### Scenario: Standalone requires docker section

- **WHEN** manifest type is `standalone`
- **THEN** validation SHALL require `docker` and `proxy` sections and an on-disk `index.html`

#### Scenario: Built-in forbids docker section

- **WHEN** manifest type is `builtin`
- **THEN** validation SHALL reject manifests that include a `docker` section

## REMOVED Requirements

### Requirement: Static type in manifest schema

**Reason**: User-uploaded static modules are replaced by built-in core modules.

**Migration**: Change existing static registry entries to `builtin` and move files to `core/builtin-modules/`.
