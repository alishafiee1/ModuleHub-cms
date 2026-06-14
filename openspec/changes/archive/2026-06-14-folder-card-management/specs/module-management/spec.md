## ADDED Requirements

### Requirement: Module card description in settings
Super Admin SHALL edit «توضیح کارت» (card description) separately from version changelog in the module gear settings. Card description SHALL persist on the layout placement node.

#### Scenario: Save card description
- **WHEN** Super Admin sets card description in module settings and saves
- **THEN** `cardDescription` is stored on the module's layout node and shown as card subtitle

#### Scenario: Changelog unchanged
- **WHEN** Super Admin updates only card description
- **THEN** `modules[id].changelog` is not overwritten unless explicitly edited in changelog field
