# OSM Scout Project Notes

**Current version: 0.1.1**

This document is the project's persistent institutional memory. Record important decisions, design rationale, research discussions, rejected approaches, and future considerations here so later development sessions can recover context.

## Project purpose

OSM Scout is an interactive human-in-the-loop utility for reviewing potential OpenStreetMap data-quality issues.

The initial focus is not to compare OSM against an authoritative dataset. That authoritative-data comparison is a possible future direction and should remain available as a later research component.

The immediate goal is to explore what can be identified from OSM itself through spatial relationships, tagging patterns, semantic consistency, completeness, and related review clues.

## Naming

Project title: **OSM Scout**

The name emphasizes finding features and potential issues that deserve human review rather than automatically declaring data to be incorrect.

## Initial study area

The first controlled exploration focuses on school-related OSM features around Ogden and Jefferson, Iowa.

## Interface decisions

The approved 0.1.0 layout is:

1. Branded header.
2. Left Actions & Controls column.
3. Right workspace:
   - Map View on top.
   - Output / Results below the map.
4. Footer with version and project tagline.

Header text:
- OSM Scout
- EXPLORE · REVIEW · IMPROVE
- OpenStreetMap Data Reviewer
- Better Data. Stronger Communities.

Footer tagline:
- Better Data. Stronger Communities.

## 0.1.0 functionality decisions

The initial functional workflow is deliberately simple:

1. Select an area by typing an Iowa city name.
2. OR draw a custom polygon on the map.
3. Select one primary OSM tag.
4. Run a read-only query.
5. Display matching OSM features on the map.
6. Display a summary below the map.

Initial primary tags:
- `amenity=*`
- `building=*`
- `shop=*`

The first version does not attempt to identify errors or anomalies. It is a feature exploration and review foundation.


## 0.1.1 decisions

The Output / Results panel now acts as an interactive tag-value filter.

For a query such as `building=*`, each unique `building` value is displayed with:
- a checkbox
- the tag value
- the number of returned matching features

All values are initially selected. Toggling a value immediately hides/shows those features on the map.

The results summary distinguishes:
- **Matching OSM features**: all features returned by the current query.
- **Currently shown on the map**: the subset remaining after tag-value filters are applied.

The application does not interpret the count as all OSM features in the area. It is limited to elements matching the selected primary tag.

## Data services

- OpenStreetMap tiles are used for the map.
- Nominatim is used only for user-initiated city searches.
- Overpass API is used for read-only feature retrieval.
- The project should avoid bulk/systematic requests against public OSM services.

## Data-review philosophy

The application should generally identify **potential issues / review candidates**, rather than automatically declaring that an OSM feature is wrong.

A useful future review result should explain why a feature deserves human attention.

Potential future review categories:
- Classification/tag consistency
- Name/tag consistency
- Possible duplicate representations
- Relationships between entities and physical buildings
- Campus structure
- Tag completeness
- Geometry/spatial relationships

## Important future direction

Authoritative Iowa school-building data comparison is intentionally deferred. It can later become a separate validation/reference layer after the OSM-internal review workflow is established.

## Development conventions

- HTML + JavaScript tool.
- Starting version: 0.1.0.
- Every release should track its version.
- README.md is the project overview.
- CHANGELOG.md documents code changes for every release.
- This file preserves project decisions and discussions for future AI-assisted development.
- Updates should be delivered as Mac terminal installers that modify only files requiring changes.

## Future ideas / not yet implemented

- Custom tag/value filters.
- More sophisticated OSM feature relationships.
- Review flags and reviewer decisions.
- Export of review results.
- Persistent review sessions.
- Authoritative-data comparison.
- More detailed geometry analysis.
- More sophisticated campus/entity modeling.
