#!/bin/bash
# Create 3 GCS buckets in asia-southeast1

PROJECT_ID="my-educloud-497414"
REGION="asia-southeast1"

# 1. Videos bucket (Standard - fast access for streaming)
gcloud storage buckets create gs://educloud-videos-497414 \
  --project=$PROJECT_ID \
  --location=$REGION \
  --default-storage-class=STANDARD \
  --uniform-bucket-level-access

# 2. Documents bucket (Standard)
gcloud storage buckets create gs://educloud-documents-497414 \
  --project=$PROJECT_ID \
  --location=$REGION \
  --default-storage-class=STANDARD \
  --uniform-bucket-level-access

# 3. Logs bucket (starts Standard, lifecycle moves to Archive)
gcloud storage buckets create gs://educloud-logs-497414 \
  --project=$PROJECT_ID \
  --location=$REGION \
  --default-storage-class=STANDARD \
  --uniform-bucket-level-access

# Enable versioning on videos + docs buckets
gcloud storage buckets update gs://educloud-videos-497414 --versioning
gcloud storage buckets update gs://educloud-documents-497414 --versioning

# Apply lifecycle rules
gcloud storage buckets update gs://educloud-logs-497414 \
  --lifecycle-file=./lifecycle_rules.json

echo "All buckets created successfully"
