# world_cities_seed.json

`world_cities_seed.json` is the scalable input for global city routes.

## Schema

Each entry is a JSON object:

```json
{
  "name": "London",
  "country": "United Kingdom",
  "state": "England",
  "latitude": 51.5074,
  "longitude": -0.1278,
  "timezone": "Europe/London",
  "aliases": ["greater london", "london uk"]
}
```

## Notes

- `name`, `country`, `latitude`, `longitude`, and `timezone` are the key fields.
- `slug` is optional. If omitted, it is generated from the city name.
- `aliases` are optional, but recommended for better long-tail SEO and city search matching.
- Detailed entries in `city_profiles.json` override generated seed-based profiles when slugs match.

## Scaling To All Cities

To support every city in the world, replace this file with a larger dataset (for example, from a licensed global cities source) using the same schema.
