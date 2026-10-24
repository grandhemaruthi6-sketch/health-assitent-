# Server Configuration & Secure Credentials Vault

This directory is protected by `.gitignore` to prevent any credentials, keys, or secrets from ever being tracked in source control.

## For Google Cloud Document AI Service Account Key
If using a Service Account JSON key:
1. In Google Cloud Console:
   - Go to **IAM & Admin** > **Service Accounts**
   - Click on `healthcopilot-ocr-service@healthcopilot-ocr.iam.gserviceaccount.com`
   - Select the **Keys** tab
   - Click **Add Key** > **Create new key** > **JSON**
   - The file will download to your computer
2. Move or rename the downloaded file to:
   `server/config/gcp-service-account-key.json`
3. Verify `GOOGLE_APPLICATION_CREDENTIALS=./server/config/gcp-service-account-key.json` in your `.env`.
4. Run `npm run test:documentai:live` to verify the connection.
5. Once verified, update `OCR_PROVIDER=google-cloud-documentai` in `.env`.

**DO NOT** share, paste, or commit this file anywhere.
