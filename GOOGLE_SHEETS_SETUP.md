# Kerala Roadbook — Google Sheets setup

1. Create a Google Cloud project, then enable the **Google Sheets API**.
2. Create a **service account**, create a JSON key for it, and copy its `client_email` and `private_key` values.
3. Create a Google Sheet and add these tabs with row 1 as the exact headers:

| Tab | Headers |
| --- | --- |
| `Trip` | `key`, `value` |
| `Itinerary` | `id`, `day`, `date`, `from`, `to`, `distanceKm`, `rideType`, `notes`, `sortOrder` |
| `Packing` | `id`, `label`, `category`, `packed`, `sortOrder` |
| `Expenses` | `id`, `date`, `label`, `amount`, `category`, `notes` |
| `Ride Prep` | `id`, `label`, `checked`, `category`, `sortOrder` |
| `Notes` | `id`, `title`, `body`, `sortOrder` |

4. Share the spreadsheet with the service account email as an **Editor**.
5. Copy the spreadsheet ID—the string after `/d/` in its URL—and add the three variables from `.env.example` to your local `.env.local` and Vercel project settings.

Add starter settings to the `Trip` tab if you like: `startDate`, `totalBudget`, `emergencyContact`, and `emergencyPhone`. All other rows can be created from the app.

Never commit the JSON key or `.env.local`. The app uses credentials only within Next.js API routes; they are not sent to the browser.
