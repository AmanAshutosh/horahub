# API

All endpoints return JSON. Errors use `{ "error": string, "details"?: unknown }`
with the status codes below.

## POST /api/chart
Generate (or fetch from cache) a chart and its reading.

Request body:
```json
{
  "fullName": "Ashutosh",
  "gender": "MALE",
  "birthDate": "1998-08-15",
  "birthTime": "14:30",
  "placeName": "Noida",
  "latitude": 28.5355,
  "longitude": 77.391,
  "tzName": "Asia/Kolkata"
}
```
Response `201`:
```json
{
  "chartId": "clx...",
  "facts": { "ayanamsa": 23.83, "lagnaSign": 7, "planets": { ... }, "houses": [ ... ], "dasha": { ... } },
  "reading": [ { "id": "planets", "heading": "Planetary Positions", "items": [ ... ] } ],
  "kbVersion": "kb-v1",
  "resolved": { "utcOffset": "+05:30", "coordinates": { "lat": 28.5355, "lon": 77.391 } }
}
```
Status codes: `201` created · `422` validation error · `429` rate limited ·
`500` internal error.

## GET /api/chart/:id
Fetch a previously generated chart + reading by id. `200` or `404`.

## GET /api/geocode?q=...
Resolve a place name to candidates. `q` must be ≥ 2 chars.
```json
{ "results": [ { "name": "Noida", "latitude": 28.5355, "longitude": 77.391,
  "admin1": "Uttar Pradesh", "admin2": "Gautam Buddha Nagar", "country": "India",
  "timezone": "Asia/Kolkata", "population": 642381 } ] }
```
Status codes: `200` · `422` (query too short).

## Rate limiting
Chart generation is limited to 20 requests / 60s per client IP when Upstash is
configured; otherwise unlimited (local dev).
