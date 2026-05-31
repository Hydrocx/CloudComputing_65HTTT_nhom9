#!/bin/bash
PROJECT_ID="my-educloud-497414"

# Create service account for backend
gcloud iam service-accounts create educloud-backend \
  --display-name="EduCloud Backend Service Account" \
  --project=$PROJECT_ID

SA_EMAIL="educloud-backend@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant Storage Admin to service account (backend full access)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.admin"

# Download key file
gcloud iam service-accounts keys create ./backend/service-account.json \
  --iam-account=$SA_EMAIL

echo "Service account created: $SA_EMAIL"
echo "Key saved to ./backend/service-account.json"
