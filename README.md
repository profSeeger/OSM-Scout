# OSM Scout

**Version 0.1.0**

OSM Scout is an HTML/JavaScript tool for interactively reviewing OpenStreetMap data. The project begins with a simple workflow: select an area, select a primary OSM tag, display matching features on a map, and summarize the results.

## Version 0.1.0

The approved 0.1.0 prototype includes:

- OSM Scout branded header and visible version number.
- Left-side Actions & Controls panel.
- City-name search for Iowa cities using OpenStreetMap Nominatim.
- Custom polygon drawing on the map.
- Primary tag selection:
  - `amenity=*`
  - `building=*`
  - `shop=*`
- Read-only OpenStreetMap feature retrieval through the Overpass API.
- Feature display on the map.
- Feature popups with name, selected tag, OSM element type/ID, and an OpenStreetMap link.
- Results summary below the map:
  - total feature count
  - number of distinct selected-tag values
  - top tag values
- Responsive layout.

## Data services

The application uses:
- OpenStreetMap tiles for the map.
- Nominatim for user-initiated city searches.
- Overpass API for read-only feature queries.

These services are provided by the OpenStreetMap ecosystem and are subject to their respective usage policies. The application is deliberately designed for interactive, user-triggered queries rather than bulk retrieval.

## Development conventions

- Technology: HTML, CSS, JavaScript.
- Starting version: 0.1.0.
- `README.md`: public project overview.
- `CHANGELOG.md`: software changes by version.
- `PROJECT_NOTES.md`: project decisions, research discussions, design decisions, rejected ideas, and institutional memory.
- Updates should be delivered as Mac terminal installers that replace only files changed by that update.

## Running

Open `index.html` in a modern browser with an internet connection.

Because the application uses remote OSM services, local browser security restrictions may vary by browser. If a browser blocks requests when opening the file directly, serve the project directory with a simple local web server, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Current research direction

The immediate research goal is not to compare OSM against an authoritative dataset. The first phase explores what OSM itself can reveal about data quality through tags, feature relationships, spatial context, completeness, and potential anomalies.

The application should identify **review candidates**, not automatically declare that a feature is wrong.
