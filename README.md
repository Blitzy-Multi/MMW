# MMW Financial Form App

This repository contains a full-stack finance form application with a React frontend and an Express backend.

## What it does

- Collects personal finance details from users
- Applies formula logic on the backend to generate:
  - `Est_Inv_Fund`
  - `Invst_Opt`
  - `Recommendation`
- Sends the generated report to your email
- Displays a thank-you page to the user

## Folder structure

- `client/` — React + Vite frontend
- `server/` — Node + Express backend

## Local development

### 1. Install dependencies

```bash
cd server
npm install
cd ../client
npm install
```

### 2. Start the backend

```bash
cd server
npm run dev
```

### 3. Start the frontend

```bash
cd client
npm run dev
```

The frontend will run on `http://localhost:5173` and proxy API requests to the backend at `http://localhost:4000`.

## Environment variables

Copy `server/.env.example` to `server/.env` and update values:

- `EMAIL_SERVICE` (for example `Gmail`)
- `EMAIL_USER`
- `EMAIL_PASS`
- `ADMIN_EMAIL`

## Production build

### Build the frontend

```bash
cd client
npm run build
```

### Build and start the backend

```bash
cd server
npm run build
npm start
```

> In production, you can configure the backend to serve the built frontend from `client/dist`.

## Deployment guidance

### GitHub Actions workflow

A workflow has been added at `.github/workflows/ci-deploy.yml`.

It will:
- build the server
- build the frontend
- upload build artifacts
- deploy the frontend to GitHub Pages from `client/dist`

### Zero-budget deployment path

1. Push this repository to GitHub.
2. Deploy the backend to a free Node hosting service such as Render, Railway, or Fly.io.
3. Set the same environment variables in the production service.
4. Optionally host the frontend separately or serve it from the backend.

### Recommended production flow

- Backend: Render / Railway / Fly.io (free tier for small usage)
- Email: Gmail SMTP (app password) or SendGrid free tier
- Source control: GitHub

## Next steps

- Replace the sample formula logic in `server/src/formulas.ts` with your spreadsheet formulas.
- Add authentication if you want secure admin access.
- Save submissions in a database later if you need persistence.
