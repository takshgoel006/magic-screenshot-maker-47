# Update prediction submission

## User-facing changes
- Add a required channel ID and one upload date/time input to the existing prediction form.
- On submit, validate all required values, convert the selected local date/time to an ISO-8601 UTC string, and POST the requested JSON to `http://localhost:8080/api/v1/predict`.
- Show loading and clear request/response errors, then keep the existing saved-result and result-page flow using the API's returned view estimate.

## Technical details
- Reuse the existing form, TanStack server function, authentication, database row shape, and result screens; do not add packages or a new backend route.
- Validate the response fields before storing it, and retain the existing date-derived weekday/time for current history and analytics.
