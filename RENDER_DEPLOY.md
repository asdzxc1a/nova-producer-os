# Deploy Backend to Render (Option A)

## Files created
- `Dockerfile` — builds the Rust server into a container image
- `render.yaml` — Render Blueprint that provisions the web service + persistent disk
- `.dockerignore` — keeps the image small

## What the setup does
- **Web Service**: `nova-producer-os-api` running Docker on Render's free tier
- **Persistent Disk**: 1 GB mounted at `/data` so workspaces, runs, and artifacts survive restarts
- **CORS**: locked to your Vercel frontend (`https://frontend-mu-three-98.vercel.app`)
- **Env vars**: `GEMINI_API_KEY` and `GEMINI_MODEL` passed securely to the container

## Step-by-step deployment

### 1. Push this project to GitHub
Because Render connects to GitHub repos, you need to push the whole `Claude Code Project` folder.

```bash
cd "/Users/dmytrnewaimastery/Documents/CLAUDE CODE/Claude Code Project"
git init
git add Dockerfile render.yaml .dockerignore nova-producer-os-web/ my-agent-cli/
git commit -m "Add Render backend deployment"
# Create a new repo on GitHub named "nova-producer-os" (or any name)
git remote add origin https://github.com/YOUR_USERNAME/nova-producer-os.git
git branch -M main
git push -u origin main
```

### 2. Connect Render to GitHub
1. Go to https://dashboard.render.com/blueprints
2. Click **"New Blueprint Instance"**
3. Select the `nova-producer-os` GitHub repo you just created
4. Render will read `render.yaml` and show you the service `nova-producer-os-api`
5. When prompted, enter your **Gemini API Key** for the `GEMINI_API_KEY` secret
6. Click **Apply**

Render will build the Docker image and start the server. This takes ~3–5 minutes the first time.

### 3. Get your Render URL
Once deployed, Render gives you a URL like:
```
https://nova-producer-os-api.onrender.com
```
Copy that URL.

### 4. Update Vercel frontend environment variable
1. Go to https://vercel.com/dashboard
2. Find your `frontend` project
3. Go to **Settings → Environment Variables**
4. Add:
   - `VITE_API_BASE` = `https://nova-producer-os-api.onrender.com/api`
5. Click **Save**
6. Redeploy the frontend (Vercel → Deployments → Redeploy latest)

### 5. Done!
- Frontend: `https://frontend-mu-three-98.vercel.app`
- Backend: `https://nova-producer-os-api.onrender.com`

Every time you push to GitHub, both services will auto-deploy.

## Troubleshooting
- If the build fails, check the Render logs for Rust compilation errors.
- If API calls fail with CORS errors, make sure `FRONTEND_URL` in `render.yaml` matches your actual Vercel domain.
- The free tier sleeps after 15 minutes of inactivity. The first API call after sleep may take ~30 seconds to wake up.
