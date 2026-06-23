## Purpose

Описывает поведение экрана управления блюдами при навигации по списку, включая сортировку, фильтрацию и отображение состояния результатов.

## Requirements

### Requirement: Sort dishes by visible metrics
The system SHALL allow users to sort the dish management list by name, weight, calories, protein, fat, and carbohydrates in ascending or descending order.

#### Scenario: Default sort is predictable
- **WHEN** the user opens the dish management page with at least one saved dish
- **THEN** the page shows a deterministic default sort option
- **THEN** the visible list order matches that default sort

#### Scenario: User changes sort field
- **WHEN** the user selects a different sort field on the dish management page
- **THEN** the list is reordered using the selected field
- **THEN** dishes without a comparable value do not break rendering or ordering

#### Scenario: User changes sort direction
- **WHEN** the user switches the sort direction for the active sort field
- **THEN** the same filtered result set is reordered in the opposite direction

### Requirement: Filter dishes by search and nutrition ranges
The system SHALL allow users to narrow the dish management list using text search by dish name and optional minimum or maximum values for calories, protein, fat, and carbohydrates.

#### Scenario: Search by name
- **WHEN** the user enters part of a dish name into the search field
- **THEN** the page shows only dishes whose names match the query case-insensitively

#### Scenario: Filter by nutrition ranges
- **WHEN** the user sets one or more nutrition range boundaries
- **THEN** the page shows only dishes whose calculated nutrition satisfies every active boundary

#### Scenario: Ignore empty filter boundaries
- **WHEN** the user leaves a minimum or maximum boundary empty
- **THEN** that boundary is treated as inactive
- **THEN** other active filters continue to apply

#### Scenario: Invalid range is contained
- **WHEN** the user enters a minimum value that is greater than the maximum value for the same metric
- **THEN** the page shows a validation state for that metric
- **THEN** the invalid range is not applied until corrected

### Requirement: Communicate active list state and recovery actions
The system SHALL show the current result state for the dish management list and provide a quick way to clear active filters.

#### Scenario: Active filters are visible
- **WHEN** the user has applied any search term or nutrition filter
- **THEN** the page shows that the list is filtered
- **THEN** the page shows how many dishes match the current criteria

#### Scenario: No dishes match filters
- **WHEN** the active sort and filter settings produce an empty result
- **THEN** the page shows a dedicated empty-results state instead of an empty grid
- **THEN** the page offers an action to clear filters or reset the filtered view
