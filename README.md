# EduCloud - GCS Course Management

Du an demo quan ly khoa hoc su dung Google Cloud Storage. He thong gom frontend (React + Vite + Tailwind) va backend (Node.js + Express).

## Cau truc thu muc

```
educloud/
  frontend/
  backend/
  infra/
  firebase.json
```

## Yeu cau

- Node.js 18+
- gcloud CLI (neu chay script tao bucket)

## Cai dat backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

> Neu chua co JWT hoac Firebase Auth, co the bat che do dev bang `DEV_AUTH_BYPASS=true` de gui `x-dev-user` tu frontend.

## Cai dat frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Infra (tuy chon)

```bash
cd infra
bash setup_buckets.sh
bash setup_iam.sh
```

## Deploy tren Compute Engine

### 1) Tao VM

- Create VM (Ubuntu 22.04 LTS), tick Allow HTTP/HTTPS.
- Neu can test dev, mo them port 3001/5173 tren firewall.

### 2) Cai dat Node.js, Git, Nginx

```bash
sudo apt update
sudo apt install -y git nginx
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3) Clone repo va cau hinh backend

```bash
git clone https://github.com/tumoazat/baidemo.git
cd baidemo/educloud/backend
cp .env.example .env
npm install
```

- Cap nhat .env (GCS bucket, PROJECT_ID, CORS_ORIGIN, JWT_SECRET).
- Tai service-account.json vao thu muc backend va dat GOOGLE_APPLICATION_CREDENTIALS=./service-account.json.

Tao systemd service:

```bash
sudo tee /etc/systemd/system/educloud-backend.service > /dev/null <<'EOF'
[Unit]
Description=EduCloud Backend
After=network.target

[Service]
WorkingDirectory=/home/USER/baidemo/educloud/backend
EnvironmentFile=/home/USER/baidemo/educloud/backend/.env
ExecStart=/usr/bin/node /home/USER/baidemo/educloud/backend/src/index.js
Restart=always
User=USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable educloud-backend
sudo systemctl start educloud-backend
```

> Doi USER thanh username thuc te tren VM.

### 4) Build frontend

```bash
cd ../frontend
cp .env.example .env
npm install
npm run build
```

### 5) Cau hinh Nginx

```bash
sudo tee /etc/nginx/sites-available/educloud > /dev/null <<'EOF'
server {
  listen 80;
  server_name _;

  root /home/USER/baidemo/educloud/frontend/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location / {
    try_files $uri /index.html;
  }
}
EOF

sudo ln -s /etc/nginx/sites-available/educloud /etc/nginx/sites-enabled/educloud
sudo nginx -t
sudo systemctl reload nginx
```

> Doi USER thanh username thuc te tren VM.

### 6) Kiem tra

- Truy cap http://PUBLIC_IP
- Backend health: http://PUBLIC_IP/api/health

## Ghi chu

Tai khoan demo:

- Admin: admin@educloud.vn
- Teacher: lan.giangvien@educloud.vn
- Student: minh.sinhvien@educloud.vn

- Signed URL mac dinh het han 5 phut.
- Lifecycle rules da dat trong `infra/lifecycle_rules.json`.
- Versioning hoat dong tren bucket videos va docs.
