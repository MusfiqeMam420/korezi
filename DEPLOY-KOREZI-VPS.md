# Korezi VPS Deployment

Recommended domains:

- `https://korezi.com` -> customer frontend on port `3000`
- `https://www.korezi.com` -> redirect/proxy to frontend
- `https://admin.korezi.com` -> admin panel on port `3001`
- `https://api.korezi.com` -> backend API on port `5000`

## 1. DNS

Point these records to your VPS IP:

```text
A  korezi.com        VPS_IP
A  www.korezi.com    VPS_IP
A  admin.korezi.com  VPS_IP
A  api.korezi.com    VPS_IP
```

## 2. Server Packages

Ubuntu example:

```bash
sudo apt update
sudo apt install -y nginx git curl build-essential
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

Install MongoDB locally or use MongoDB Atlas. If using local MongoDB, set `MONGO_URI=mongodb://127.0.0.1:27017/korezi`.

## 3. Upload Code

```bash
sudo mkdir -p /var/www/korezi
sudo chown -R $USER:$USER /var/www/korezi
cd /var/www/korezi
git clone YOUR_REPO_URL .
```

If you are not using git, upload the project folder with SFTP to `/var/www/korezi`.

## 4. Environment Files

Create:

```bash
cp backend/.env.production.example backend/.env
cp frontend/.env.production.example frontend/.env.production
cp admin/.env.production.example admin/.env.production
```

Edit `backend/.env` and set a strong `JWT_SECRET` and real `MONGO_URI`.

## 5. Install And Build

```bash
cd /var/www/korezi/backend
npm install

cd /var/www/korezi/frontend
npm install
npm run build

cd /var/www/korezi/admin
npm install
npm run build
```

## 6. PM2

Copy `ecosystem.config.cjs` to `/var/www/korezi/ecosystem.config.cjs`, then:

```bash
cd /var/www/korezi
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup`.

## 7. Nginx

Create `/etc/nginx/sites-available/korezi`:

```nginx
server {
    listen 80;
    server_name korezi.com www.korezi.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name admin.korezi.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name api.korezi.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/korezi /etc/nginx/sites-enabled/korezi
sudo nginx -t
sudo systemctl reload nginx
```

## 8. SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d korezi.com -d www.korezi.com -d admin.korezi.com -d api.korezi.com
```

## 9. Uploads Backup

Product/category/cover/video uploads live in:

```text
/var/www/korezi/backend/uploads
```

Back this folder up regularly.

## 10. Updating Later

```bash
cd /var/www/korezi
git pull

cd frontend && npm install && npm run build
cd ../admin && npm install && npm run build
cd ../backend && npm install

cd /var/www/korezi
pm2 restart ecosystem.config.cjs
```
