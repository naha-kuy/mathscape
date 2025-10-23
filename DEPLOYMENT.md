# 🚀 Panduan Deployment - Game Uji Geometri 3D

## 📋 Prerequisites

### Server Requirements
- **Web Server**: Apache, Nginx, atau server web modern lainnya
- **HTTPS**: Wajib untuk PWA (Service Worker)
- **Storage**: Minimal 50MB untuk assets dan cache
- **PHP/Node.js**: Opsional untuk future API endpoints

### Browser Support
- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile**: iOS Safari 13+, Chrome Mobile 80+
- **WebGL**: Hardware acceleration required untuk 3D rendering

## 🏗️ Build Process

### 1. Pre-deployment Checklist
```bash
# Check all files exist
ls -la *.html *.js *.css manifest.json sw.js

# Validate JSON files
python -m json.tool manifest.json > /dev/null && echo "manifest.json OK"
python -m json.tool package.json > /dev/null 2>/dev/null && echo "package.json OK"

# Check file sizes
du -sh * | sort -hr
```

### 2. Optimization Commands
```bash
# Minify HTML files
for file in *.html; do
    html-minifier "$file" -o "${file%.html}.min.html" --collapse-whitespace --remove-comments
done

# Minify CSS
cleancss styles.css -o styles.min.css --level 2

# Minify JavaScript
for file in *.js; do
    uglifyjs "$file" -o "${file%.js}.min.js" --compress --mangle
done

# Optimize images (if any)
# mogrify -resize 192x192 icon.png icon-192.png
# mogrify -resize 512x512 icon.png icon-512.png
```

### 3. File Structure After Build
```
📁 dist/
├── 📄 index.html           # Minified main app
├── 📄 peta-konstruksi.html # Standalone pages
├── 📄 lahan-syarat.html
├── 📄 lahan-bermain.html
├── 📄 petunjuk-konstruksi.html
├── 📄 styles.min.css       # Minified CSS
├── 📄 app.min.js          # Minified JS
├── 📄 analytics.min.js
├── 📄 performance.min.js
├── 📄 error-monitor.min.js
├── 📄 three.min.js        # External libs
├── 📄 OrbitControls.js
├── 📄 manifest.json       # PWA manifest
├── 📄 sw.min.js          # Service worker
├── 📁 pages/             # Page controllers
│   ├── 📄 menu.min.js
│   ├── 📄 lahan-syarat.min.js
│   └── 📄 shared-three.min.js
├── 📁 assets/            # Static assets
│   ├── 🖼️ icon-192.png
│   ├── 🖼️ icon-512.png
│   └── 🖼️ screenshot-*.png
└── 📄 robots.txt         # SEO
```

## 🌐 Web Server Configuration

### Nginx Configuration
```nginx
# /etc/nginx/sites-available/geometri-3d
server {
    listen 80;
    server_name geometri3d.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name geometri3d.example.com;

    # SSL Configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Root directory
    root /var/www/geometri3d/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; worker-src 'self' blob:;" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Cache-Status "STATIC";
    }

    # Service worker
    location /sw.js {
        add_header Cache-Control "no-cache";
        add_header X-Cache-Status "SW";
    }

    # API endpoints (future)
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Logs
    access_log /var/log/nginx/geometri3d_access.log;
    error_log /var/log/nginx/geometri3d_error.log;
}
```

### Apache Configuration
```apache
# /etc/apache2/sites-available/geometri3d.conf
<VirtualHost *:80>
    ServerName geometri3d.example.com
    Redirect permanent / https://geometri3d.example.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName geometri3d.example.com

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/ssl/cert.pem
    SSLCertificateKeyFile /path/to/ssl/private.key

    DocumentRoot /var/www/geometri3d/dist

    # Security headers
    Header always set X-Frame-Options SAMEORIGIN
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; worker-src 'self' blob:;"

    # SPA fallback
    FallbackResource /index.html

    # Cache control
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        Header set Cache-Control "max-age=31536000, public, immutable"
    </FilesMatch>

    # Service worker
    <Files "sw.js">
        Header set Cache-Control "no-cache"
    </Files>

    # Logs
    CustomLog /var/log/apache2/geometri3d_access.log combined
    ErrorLog /var/log/apache2/geometri3d_error.log
</VirtualHost>
```

## ☁️ Cloud Deployment Options

### Vercel (Recommended for Quick Deploy)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache"
        }
      ]
    },
    {
      "source": "/(.*\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot))$",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Netlify
```yaml
# netlify.toml
[build]
  publish = "dist"
  command = "echo 'No build step required'"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### GitHub Pages
```bash
# Build and deploy to gh-pages branch
npm run build
npx gh-pages -d dist
```

## 🔧 Environment Configuration

### Production Environment Variables
```javascript
// config.js (create this file)
window.APP_CONFIG = {
  ENVIRONMENT: 'production',
  VERSION: '1.0.0',
  API_BASE_URL: 'https://api.geometri3d.example.com',
  ANALYTICS_ENABLED: true,
  PERFORMANCE_MONITORING: true,
  ERROR_REPORTING: true,
  DEBUG_MODE: false
};
```

### Feature Flags
```javascript
// Feature toggles for gradual rollouts
window.FEATURE_FLAGS = {
  NEW_LEVELS: false,
  ADVANCED_ANALYTICS: true,
  OFFLINE_MODE: true,
  MULTI_LANGUAGE: false,
  ADMIN_DASHBOARD: false
};
```

## 📊 Monitoring & Analytics

### Google Analytics 4
```html
<!-- Add to index.html head -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Custom Analytics Dashboard
```javascript
// Future API integration
const analyticsAPI = {
  async sendEvent(eventType, data) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          data,
          timestamp: Date.now(),
          sessionId: getSessionId(),
          userId: getUserId()
        })
      });
    } catch (error) {
      console.error('Analytics API error:', error);
    }
  }
};
```

## 🧪 Testing & Quality Assurance

### Automated Testing Setup
```bash
# Install testing dependencies
npm init -y
npm install --save-dev jest puppeteer cypress lighthouse

# Test scripts in package.json
{
  "scripts": {
    "test": "jest",
    "test:e2e": "cypress run",
    "test:performance": "lighthouse http://localhost:3000 --output=json --output-path=./reports/lighthouse.json",
    "test:accessibility": "pa11y http://localhost:3000"
  }
}
```

### CI/CD Pipeline (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm run test:performance

  deploy:
    needs: [test, lighthouse]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm run build
      - uses: vercel/action@1.0.0
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 🚨 Error Monitoring

### Sentry Integration
```javascript
// error-monitor.js enhancement
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "YOUR_DSN_HERE",
  environment: "production",
  release: "geometri-3d@1.0.0",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 0.1,
});

// Replace console.error with Sentry
const originalConsoleError = console.error;
console.error = function(...args) {
  Sentry.captureMessage(args.join(' '), 'error');
  originalConsoleError.apply(console, args);
};
```

## 🔒 Security Considerations

### Content Security Policy (CSP)
```nginx
# Nginx CSP header
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.geometri3d.example.com; worker-src 'self' blob:;" always;
```

### HTTPS Enforcement
```nginx
# Force HTTPS
if ($scheme != "https") {
    return 301 https://$server_name$request_uri;
}
```

## 📈 Performance Optimization

### Core Web Vitals Targets
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### CDN Integration
```html
<!-- Use CDN for Three.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
```

## 🔄 Maintenance & Updates

### Update Strategy
1. **Feature Flags**: Roll out new features gradually
2. **Staged Deployment**: Beta → Staging → Production
3. **Rollback Plan**: Keep previous version available
4. **Database Migrations**: For future backend integration

### Backup Strategy
```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "backup_$DATE.tar.gz" /var/www/geometri3d/
aws s3 cp "backup_$DATE.tar.gz" s3://geometri3d-backups/
```

## 📞 Support & Monitoring

### Health Check Endpoint
```javascript
// health.js
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime()
  });
});
```

### Log Aggregation
```bash
# Install monitoring stack
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  prom/prometheus

docker run -d \
  --name grafana \
  -p 3000:3000 \
  grafana/grafana
```

## 🎯 Success Metrics

### User Engagement
- **Daily Active Users (DAU)**
- **Session Duration**: Average > 10 minutes
- **Level Completion Rate**: Target > 70%
- **Return Visitor Rate**: Target > 40%

### Technical Performance
- **Page Load Time**: < 3 seconds
- **Error Rate**: < 1%
- **PWA Install Rate**: > 20%
- **Offline Usage**: > 30% of sessions

---

## 🚀 Quick Start Deployment

```bash
# 1. Clone repository
git clone https://github.com/your-org/geometri-3d.git
cd geometri-3d

# 2. Install dependencies
npm install

# 3. Run tests
npm test

# 4. Build for production
npm run build

# 5. Deploy to Vercel
npx vercel --prod

# 6. Verify deployment
curl -I https://your-app.vercel.app
```

**Deployment Checklist:**
- [ ] SSL certificate configured
- [ ] Service worker registered
- [ ] Analytics tracking active
- [ ] Error monitoring enabled
- [ ] Performance monitoring active
- [ ] CDN configured for assets
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured

**Post-Deployment:**
1. Monitor error rates and performance metrics
2. Collect user feedback and analytics data
3. Plan feature updates based on usage patterns
4. Scale infrastructure as user base grows