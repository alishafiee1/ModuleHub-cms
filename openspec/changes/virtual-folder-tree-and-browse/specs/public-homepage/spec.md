## MODIFIED Requirements

### Requirement: Public homepage at root folder

`GET /` SHALL render the folder view for `rootFolderId` including breadcrumb (home only), module cards, folder cards, and optional admin Add card.

#### Scenario: Root homepage with folders

- **WHEN** layout has folders and items in root
- **THEN** `/` SHALL list root-level items only

### Requirement: Homepage driven by folder context

Homepage renderer SHALL accept `currentFolderId` to filter items by `folderId`.

#### Scenario: Filter items by folder

- **WHEN** rendering folder `portfolio`
- **THEN** only items with `folderId: portfolio` SHALL appear
