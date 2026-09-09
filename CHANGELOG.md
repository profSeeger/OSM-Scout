# Changelog

## [0.1.1] - 2026-09-09

### Added
- Interactive tag-value filters in the Output / Results panel.
- Select all and Clear all controls for returned tag values.
- Map visibility updates immediately when a tag value is toggled.
- Visible-feature count updates as tag values are toggled.
- Clearer "Matching OSM features" terminology to distinguish search results from all OSM data.

### Changed
- Results now retain the full query result count while separately reporting how many matching features are currently shown on the map.
- Returned OSM geometries continue to be used for mapped ways where available.



All notable OSM Scout changes are documented here.

## [0.1.0] - 2026-09-09

### Added
- Initial approved OSM Scout application layout.
- OSM Scout branded header with visible version number.
- "OpenStreetMap Data Reviewer" byline.
- "Better Data. Stronger Communities." project tagline.
- City name input for Iowa city searches.
- User-initiated city geocoding through Nominatim.
- Interactive OpenStreetMap map using Leaflet.
- Custom polygon drawing using Leaflet Draw.
- Area selection status display.
- Primary tag selector for:
  - `amenity=*`
  - `building=*`
  - `shop=*`
- Read-only Overpass API queries for the selected tag within the selected area.
- Map display of returned features.
- Feature popups with OSM element information and OpenStreetMap links.
- Results summary beneath the map.
- Total feature count.
- Distinct selected-tag value count.
- Top selected-tag values.
- Responsive interface.
- Project README and persistent project notes.
