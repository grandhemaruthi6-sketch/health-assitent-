# OCR production API routing

The web client must send OCR requests to the Express backend, not the Vite/Vercel static frontend.

## Local development

Set `VITE_API_BASE_URL=http://localhost:5001/api` in the frontend environment and run the backend with `npm run server`. Vite proxies `/api` to port 5001 when this variable is not set.

## Production

1. Deploy the `server/` Express app as a persistent backend service (for example, Render). Configure the OCR provider and Google Document AI credentials on that backend only.
2. In the Vercel project serving the frontend, set `VITE_API_BASE_URL` to the backend origin followed by `/api`, for example `https://YOUR-BACKEND.onrender.com/api`.
3. Redeploy the frontend after changing the environment variable. Vite variables are embedded at build time.
4. Open `https://YOUR-BACKEND.onrender.com/api/ocr/health` and confirm the response is JSON. `READY` means configuration is present, not that a live document was tested.
5. Upload a small, readable PDF/image and verify the browser Network panel shows a JSON response from `/clinical/analyze` on the backend host.

Never put Google service-account credentials in `VITE_*` variables or the frontend bundle.
