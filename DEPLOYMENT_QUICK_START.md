# クイックデプロイガイド - 30 分で完了

このガイドは、EC2 へのデプロイを効率的に進めるための手順書です。

## ⏱️ 所要時間の目安

- **経験者**: 20-30 分
- **初めて**: 45-60 分

## 📋 前提条件チェックリスト

デプロイを開始する前に、以下を確認してください：

- [ ] AWS アカウントがある
- [ ] EC2 インスタンスを起動できる
- [ ] ドメイン名を持っている（または無料ドメインを取得できる）
- [ ] SSH キーペア（.pem ファイル）がある
- [ ] GitHub リポジトリが公開されている、または EC2 からアクセスできる

---

## 🚀 ステップ 1: EC2 インスタンスの起動（5-10 分）

### 1.1 AWS コンソールで EC2 インスタンスを起動

1. AWS コンソールにログイン
2. EC2 ダッシュボード → 「インスタンスを起動」
3. 設定：

   - **名前**: `cubie-api-server`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **インスタンスタイプ**: t2.micro（無料枠内）
   - **キーペア**: 既存のキーペアを選択、または新規作成
   - **ネットワーク設定**:
     - SSH (22): マイ IP
     - HTTP (80): どこからでも
     - HTTPS (443): どこからでも

4. 「インスタンスを起動」をクリック

### 1.2 パブリック IP アドレスをメモ

インスタンスが起動したら、**パブリック IPv4 アドレス**をメモしてください。

---

## 🔧 ステップ 2: EC2 への接続と基本設定（10-15 分）

### 2.1 SSH 接続

```bash
# キーファイルの権限を設定（初回のみ）
chmod 400 your-key.pem

# EC2に接続
ssh -i your-key.pem ubuntu@YOUR_EC2_IP_ADDRESS
```

### 2.2 システムの更新

```bash
sudo apt update
sudo apt upgrade -y
```

### 2.3 Node.js のインストール

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 確認
node --version
npm --version
```

### 2.4 MongoDB のインストール

```bash
# MongoDB GPGキーのインポート
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# リポジトリの追加
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# インストール
sudo apt-get update
sudo apt-get install -y mongodb-org

# 起動と有効化
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2.5 PM2 のインストール

```bash
sudo npm install -g pm2
```

### 2.6 Nginx のインストール

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.7 Git のインストール

```bash
sudo apt install git -y
```

---

## 📦 ステップ 3: アプリケーションのデプロイ（5-10 分）

### 3.1 リポジトリのクローン

```bash
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/Cubie-SecureFullStackDeployment.git
cd Cubie-SecureFullStackDeployment
```

**注意**: GitHub リポジトリがプライベートの場合は、SSH キーを設定するか、アクセストークンを使用してください。

### 3.2 依存関係のインストール

```bash
# サーバー側
cd server
npm install

# クライアント側（ビルド用）
cd ../client
npm install
npm run build
```

### 3.3 環境変数の設定

```bash
# サーバーの.envファイルを作成
cd /home/ubuntu/Cubie-SecureFullStackDeployment/server
nano .env
```

以下の内容を入力（既存の.env ファイルの内容をコピー＆ペースト）：

```env
NODE_ENV=production
PORT=5001
MONGO_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
JWT_TOKEN_EXPIRES_IN=7d
CLIENT_ORIGIN_URL=https://your-domain.com
SESSION_SECRET=your-session-secret
# ... その他の環境変数
```

保存: `Ctrl+O` → `Enter` → `Ctrl+X`

### 3.4 ログディレクトリの作成

```bash
mkdir -p /home/ubuntu/Cubie-SecureFullStackDeployment/server/logs
```

---

## ⚙️ ステップ 4: PM2 でアプリケーション起動（2-3 分）

```bash
cd /home/ubuntu/Cubie-SecureFullStackDeployment/server
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# 表示されたコマンドを実行（sudo権限が必要）
```

---

## 🌐 ステップ 5: Nginx 設定（5-10 分）

### 5.1 Nginx 設定ファイルの作成

```bash
sudo nano /etc/nginx/sites-available/cubie-api
```

以下の内容を入力（`nginx.conf`の内容をコピー＆ペースト、ドメイン名を更新）：

```nginx
upstream cubie_api {
    least_conn;
    server localhost:5001;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name YOUR_DOMAIN_NAME.com;  # ← ここを変更

    location /api {
        proxy_pass http://cubie_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        return 200 "Cubie API Server\n";
        add_header Content-Type text/plain;
    }
}
```

保存: `Ctrl+O` → `Enter` → `Ctrl+X`

### 5.2 サイトの有効化

```bash
sudo ln -s /etc/nginx/sites-available/cubie-api /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 5.3 ファイアウォール設定

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## 🔒 ステップ 6: SSL 証明書の取得（5-10 分）

### 6.1 Certbot のインストール

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2 ドメイン名の DNS 設定

**重要**: このステップは、ドメイン名の DNS 設定が完了している必要があります。

1. ドメインの DNS 設定で、EC2 のパブリック IP アドレスに A レコードを設定
2. 数分待って DNS が反映されるのを確認

### 6.3 SSL 証明書の取得

```bash
sudo certbot --nginx -d YOUR_DOMAIN_NAME.com
```

プロンプトに従って：

- メールアドレスを入力
- 利用規約に同意
- HTTP→HTTPS リダイレクト: Yes

### 6.4 自動更新の確認

```bash
sudo certbot renew --dry-run
```

---

## ✅ ステップ 7: 動作確認（2-3 分）

### 7.1 API エンドポイントの確認

```bash
# ヘルスチェック
curl http://localhost:5001/api/auth/profile

# またはブラウザで
# https://YOUR_DOMAIN_NAME.com/api/auth/profile
```

### 7.2 PM2 の状態確認

```bash
pm2 status
pm2 logs cubie-api-server
```

### 7.3 Nginx のログ確認

```bash
sudo tail -f /var/log/nginx/error.log
```

---

## 🎉 完了！

これで、アプリケーションが EC2 上で HTTPS で動作しているはずです。

## 📝 次のステップ

- フロントエンドのデプロイ（別のサーバーまたは同じサーバー）
- モニタリングの設定
- バックアップの設定

---

## ⚠️ トラブルシューティング

### アプリケーションが起動しない

```bash
pm2 logs cubie-api-server
# エラーログを確認
```

### Nginx が動作しない

```bash
sudo nginx -t
sudo systemctl status nginx
```

### SSL 証明書が取得できない

- DNS 設定が正しいか確認
- ポート 80 と 443 が開いているか確認
- 数分待ってから再試行

---

## 📚 参考資料

詳細な手順は `DEPLOYMENT.md` を参照してください。
