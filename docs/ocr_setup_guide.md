# Google Cloud Document AI Setup Guide — HealthCopilot AI

This guide details the exact steps required to configure and operate the Google Cloud Document AI OCR pipeline for the HealthCopilot AI backend.

---

## 1. Prerequisites
- A Google Cloud Platform (GCP) Account with an active billing project.
- Permission to create IAM Service Accounts and Document AI Processors.

---

## 2. Google Cloud Setup (Step-by-Step)

### Step 1: Enable the Document AI API
Run the following `gcloud` command or enable via Google Cloud Console:
```bash
gcloud services enable documentai.googleapis.com --project=YOUR_PROJECT_ID
```

### Step 2: Create a Document OCR Processor
1. In Google Cloud Console, open **Document AI** > **Processors**.
2. Click **Create Processor**.
3. Select **Document OCR** (general text extraction) or **Form Parser** (for structured key-value & table extraction).
4. Enter:
   - **Processor Name**: `healthcopilot-ocr-processor`
   - **Region**: `us` (United States) or `eu` (European Union)
5. Click **Create**.
6. Copy the generated **Processor ID** (a 16-character alphanumeric ID, e.g., `a1b2c3d4e5f6g7h8`).

### Step 3: Create a Dedicated Service Account
1. Open **IAM & Admin** > **Service Accounts**.
2. Click **Create Service Account**:
   - **Name**: `healthcopilot-documentai-sa`
   - **Description**: `Service account for HealthCopilot AI OCR extraction`
3. Grant the required Document AI role:
   - **Role**: `Document AI API User` (`roles/documentai.apiUser`) or `Document AI Viewer`
4. Click **Done**.
5. Select the newly created Service Account > **Keys** tab > **Add Key** > **Create new key** > **JSON**.
6. Download the key JSON and save it in a secure location on your server (never commit it to git).

---

## 3. Environment Configuration

Copy `.env.example` to `.env` in the project root:
```bash
cp .env.example .env
```

Set the values in `.env`:
```env
PORT=5001
OCR_PROVIDER=google-cloud-documentai
GCP_PROJECT_ID=your-actual-project-id
GCP_LOCATION=us
GCP_PROCESSOR_ID=your-actual-processor-id
GOOGLE_APPLICATION_CREDENTIALS=C:/secure/keys/healthcopilot-documentai-sa.json
OCR_TIMEOUT_MS=45000
```

---

## 4. Verification & Safe Health Check

### Health Check Endpoint
Query the safe health check endpoint:
```bash
curl http://localhost:5001/api/ocr/health
```

#### Expected Output when Configured:
```json
{
  "status": "READY",
  "provider": "google-cloud-documentai",
  "message": "Google Cloud Document AI provider is configured and ready.",
  "supportedMimeTypes": ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  "maxFileSizeBytes": 20971520,
  "hasAuthCredentials": true,
  "details": {
    "projectId": "your-actual-project-id",
    "location": "us",
    "processorId": "a1b...7h8"
  }
}
```

#### Output when Cloud Credentials are Missing:
```json
{
  "status": "DEGRADED",
  "provider": "google-cloud-documentai",
  "message": "Missing required GCP environment variables: GCP_PROJECT_ID, GCP_PROCESSOR_ID",
  "missingVariables": ["GCP_PROJECT_ID", "GCP_PROCESSOR_ID"],
  "hasAuthCredentials": false
}
```

---

## 5. API Reference

### `POST /api/ocr/process`

#### Request (Multipart Form):
```http
POST /api/ocr/process HTTP/1.1
Host: localhost:5001
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="document"; filename="lab_report.pdf"
Content-Type: application/pdf

<binary data>
------WebKitFormBoundary--
```

#### Response (Structured Result Schema):
```json
{
  "success": true,
  "data": {
    "documentId": "4a71b123-...",
    "provider": "google-cloud-documentai",
    "processingStatus": "SUCCESS",
    "pageCount": 2,
    "fullText": "APOLLO MULTISPECIALITY HOSPITAL...",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Hemoglobin 14.2 g/dL...",
        "confidence": 0.985,
        "layout": {
          "paragraphCount": 6,
          "lineCount": 18,
          "paragraphs": [...],
          "lines": [...],
          "formFields": [
            { "fieldName": "Patient", "fieldValue": "Priya Sharma", "confidence": 0.99 }
          ],
          "tables": [
            { "rowCount": 5, "confidence": 0.98 }
          ]
        }
      }
    ],
    "metadata": {
      "mimeType": "application/pdf",
      "sizeBytes": 2411520,
      "latencyMs": 1420
    },
    "warnings": []
  },
  "executionTimeMs": 1435
}
```

---

## 6. Error Codes & Recovery Matrix

| Error Code | HTTP Status | Meaning | Actionable Fix |
|---|---|---|---|
| `EMPTY_BUFFER` / `EMPTY_FILE` | 400 | The uploaded file was 0 bytes. | Check file selector on client before sending. |
| `UNSUPPORTED_FORMAT` | 400 | File type is not PDF, JPG, or PNG. | Restrict client uploads to allowed medical formats. |
| `SIGNATURE_MISMATCH` | 400 | Magic bytes don't match declared MIME. | Prevent corrupted or renamed files from reaching OCR. |
| `FILE_TOO_LARGE` | 400 | File exceeds 20 MB limit. | Compress document or split pages before upload. |
| `CREDENTIALS_MISSING` | 503 | Server missing GCP environment variables. | Provide `GCP_PROJECT_ID`, `GCP_PROCESSOR_ID`, and key file. |
| `PERMISSION_DENIED` | 502 | IAM role missing on service account. | Add `roles/documentai.apiUser` to the service account. |
| `PROCESSOR_NOT_FOUND` | 502 | Processor ID doesn't exist in given region. | Verify processor ID and `GCP_LOCATION` match. |
| `RATE_LIMITED` | 429 | Exceeded Google Cloud QPS quota. | Automatic exponential backoff will retry up to 2 times. |
| `TIMEOUT` | 504 | Google Document AI took > 45 seconds. | Check network connectivity or document size. |
| `UNREADABLE_DOCUMENT` | 200 / 422 | Image was blank or resolution too low. | Prompt user to take a clearer, illuminated photo. |

---

## 7. Healthcare Privacy & HIPAA Compliance
1. **Zero Client Leaks**: GCP service keys and credentials are kept strictly server-side in `.env`.
2. **Ephemeral In-Memory Handling**: Files are processed using in-memory buffers and are not persisted to unencrypted local disk.
3. **Transport Encryption**: All communication with Google Cloud Document AI occurs over TLS 1.3 encrypted gRPC / HTTPS endpoints.
