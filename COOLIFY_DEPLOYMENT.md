# Coolify Deployment Guide

This guide will help you deploy the Clocked Assignment Tracker API server to Coolify.

## Prerequisites

- A Coolify instance (self-hosted or cloud)
- Git repository access
- OpenAI API key

## Quick Deploy

### 1. Create New Resource in Coolify

1. Log in to your Coolify dashboard
2. Click **+ New Resource**
3. Select **Public Repository**
4. Enter your repository URL: `https://github.com/YOUR_USERNAME/YOUR_REPO.git`
5. Click **Continue**

### 2. Configure Application

**Build Settings:**

- **Build Pack**: Dockerfile
- **Dockerfile Location**: `./Dockerfile` (should auto-detect)
- **Port**: `4000`

**Environment Variables:**

Add the following environment variables in Coolify:

| Key              | Value               | Required |
| ---------------- | ------------------- | -------- |
| `PORT`           | `4000`              | Yes      |
| `OPENAI_API_KEY` | Your OpenAI API key | Yes      |

To add environment variables:

1. Go to **Environment Variables** tab
2. Click **+ Add**
3. Enter key and value
4. Check **Build Time** if needed during build
5. Click **Save**

### 3. Configure Persistent Storage (Important!)

The SQLite database needs persistent storage to survive container restarts.

1. Go to **Storages** tab
2. Click **+ Add Storage**
3. Configure:
   - **Name**: `database`
   - **Source Path**: `/app/data` (container path - the entire data directory)
   - **Destination Path**: Auto-generated or custom path on host
   - **Is Directory**: Yes
4. Click **Save**

**Note**: The database file will be stored at `/app/data/hackathon.db` inside the container.

### 4. Configure Health Check

1. Go to **Health Check** tab
2. Enable health check
3. Configure:
   - **Health Check Path**: `/health`
   - **Port**: `4000`
   - **Interval**: `30s`
   - **Timeout**: `3s`
   - **Retries**: `3`
   - **Start Period**: `40s`

### 5. Deploy

1. Click **Deploy** button
2. Wait for build to complete (may take 3-5 minutes on first deploy)
3. Monitor logs in the **Logs** tab
4. Once deployed, you'll see a URL like `https://your-app.coolify.app`

## Post-Deployment Configuration

### Update Mobile App

Update your mobile app's `.env` file with the new server URL:

```env
EXPO_PUBLIC_API_URL=https://your-app.coolify.app
```

### Update Chrome Extension

When using the Chrome extension, enter your new server URL:

```
https://your-app.coolify.app
```

## Verify Deployment

### Test Health Endpoint

```bash
curl https://your-app.coolify.app/health
```

Expected response:

```json
{ "status": "ok", "timestamp": "2025-10-19T12:00:00.000Z" }
```

### Test Admin Dashboard

Open in browser:

```
https://your-app.coolify.app
```

You should see the admin dashboard with users and assignments.

### Test API Endpoints

```bash
# Register a user
curl -X POST https://your-app.coolify.app/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Get users
curl https://your-app.coolify.app/api/users
```

## Environment Variables Reference

| Variable         | Description               | Example       | Required |
| ---------------- | ------------------------- | ------------- | -------- |
| `PORT`           | Server port               | `4000`        | Yes      |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o | `sk-proj-...` | Yes      |

## Troubleshooting

### Build Fails

**Problem**: Build fails with "python3 not found" or similar

**Solution**: The Dockerfile already includes all necessary dependencies (python3, make, g++). Check build logs for specific errors.

**Problem**: "Module not found" errors

**Solution**: Ensure `package.json` and `package-lock.json` are committed to the repository.

### Database Issues

**Problem**: `SqliteError: unable to open database file` (SQLITE_CANTOPEN)

**Solution**: This means the database directory doesn't exist or isn't writable. Fix:

1. Make sure persistent storage is configured in Coolify pointing to `/app/data`
2. Redeploy the application
3. Check logs to see the database path: `📂 Database path: /app/data/hackathon.db`
4. If still failing, the storage volume might not be mounted correctly in Coolify

**Problem**: Database resets on each deployment

**Solution**: Make sure you've configured persistent storage (see Step 3). The database file needs to persist between container restarts. The storage should point to `/app/data` directory (not a single file).

**Problem**: "Database is locked" error

**Solution**: SQLite may have issues with concurrent writes. This is normal for the cron job. Errors are logged but don't affect functionality.

### OpenAI Errors

**Problem**: "OpenAI API key invalid"

**Solution**:

1. Verify your API key is correct in environment variables
2. Check your OpenAI account has credits
3. Ensure the key has proper permissions

**Problem**: GPT-4o notifications not sending

**Solution**: Check server logs. The app will use fallback messages if OpenAI fails.

### Health Check Failing

**Problem**: Coolify shows "unhealthy" status

**Solution**:

1. Check if port `4000` is exposed correctly
2. Verify `/health` endpoint returns 200 status
3. Increase start period if app takes longer to boot
4. Check logs for errors during startup

### Logs

View real-time logs in Coolify:

1. Go to your application
2. Click **Logs** tab
3. Watch for errors during startup

Common startup messages:

```
Server running on port 4000
Database initialized
Cron job scheduled
```

## Database Backup

### Manual Backup

To backup the SQLite database:

1. SSH into your Coolify host
2. Find the volume path (check Coolify storage settings)
3. Copy the database file:

```bash
cp /path/to/volume/hackathon.db /backup/hackathon-$(date +%Y%m%d).db
```

### Automated Backups

Add a scheduled task in Coolify or use a backup service that supports volumes.

## Scaling Considerations

### Current Limitations

- **SQLite**: Not suitable for high concurrency
- **In-process cron**: Single instance only
- **No Redis**: Jobs run in-process

### For Production Scale

If you need to scale beyond a single instance:

1. **Migrate to PostgreSQL**:

   - Update database code to use `pg` instead of `better-sqlite3`
   - Update Dockerfile to remove SQLite dependencies
   - Add PostgreSQL service in Coolify

2. **Use external job queue**:

   - Replace `node-cron` with Bull + Redis
   - Add Redis service in Coolify
   - Update cron logic to use job queue

3. **Add Redis for caching**:
   - Cache OpenAI responses
   - Cache user/assignment queries
   - Reduce database load

## Updates & Redeployment

### Automatic Deployments

Enable automatic deployments in Coolify:

1. Go to **Source** tab
2. Enable **Automatic Deployment**
3. Select branch (e.g., `main`)
4. Save

Now, every push to the branch will trigger a deployment.

### Manual Redeploy

1. Click **Deploy** button in Coolify
2. Wait for build to complete
3. Database persists across deployments (if storage configured correctly)

### Zero-Downtime Deployments

Coolify supports zero-downtime deployments:

1. Go to **Advanced** settings
2. Enable **Zero Downtime Deployment**
3. New container starts before old one stops

## Security Recommendations

### For Production Use

1. **Add authentication**:

   - Admin dashboard should require login
   - API endpoints should use JWT tokens

2. **Rate limiting**:

   ```bash
   npm install express-rate-limit
   ```

3. **HTTPS only**:

   - Coolify provides automatic SSL
   - Force HTTPS in your app

4. **Secure environment variables**:

   - Never commit `.env` file
   - Use Coolify's encrypted environment variables

5. **Input validation**:
   - Validate all user inputs
   - Sanitize database queries (currently using prepared statements - good!)

## Cost Optimization

### OpenAI API Costs

- GPT-4o costs ~$0.005 per notification
- 1000 users × 1 notification/hour = ~$120/day
- Consider:
  - Reducing notification frequency
  - Using GPT-3.5-turbo (cheaper)
  - Caching similar messages
  - Only sending when assignments are due soon

### Server Costs

- Coolify can run on a $5/month VPS
- Scales well for 100-1000 users
- For more users, consider upgrading host specs

## Monitoring

### Built-in Monitoring

Coolify provides:

- CPU/Memory usage graphs
- Container logs
- Health check status
- Build history

### External Monitoring (Optional)

Consider adding:

- **Sentry** for error tracking
- **Uptime monitoring** (UptimeRobot, etc.)
- **Log aggregation** (Datadog, Logtail)

## Support & Issues

If you encounter issues:

1. Check Coolify logs first
2. Verify environment variables are set
3. Ensure persistent storage is configured
4. Test health endpoint manually
5. Check OpenAI API status

For application-specific issues, refer to the main README.md and CLAUDE.md documentation.

## Quick Reference

### Coolify Configuration Summary

```yaml
Build Pack: Dockerfile
Port: 4000
Health Check: /health
Environment:
  - PORT=4000
  - OPENAI_API_KEY=sk-proj-...
Storage:
  - /app/data → persistent volume (database stored at /app/data/hackathon.db)
```

### Useful Commands

```bash
# Test deployment locally with Docker
docker build -t hackathon-api .
docker run -p 4000:4000 -e OPENAI_API_KEY=your-key hackathon-api

# Test with docker-compose
docker-compose up

# Check logs
docker logs <container-id>

# Access container shell
docker exec -it <container-id> sh
```

---

**Last Updated**: 2025-10-19

For questions about Coolify itself, visit: https://coolify.io/docs
