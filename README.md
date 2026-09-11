# Serenity Customer Booking

Standalone Next.js customer application for salon discovery, treatment browsing, booking, and account management.

## Run locally

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3001.

## API and login configuration

Set `BACKEND_URL` to the backend origin (for example,
`https://saas-backend.mine.bz`) before building and starting the app.
Browser requests use `/api`, which Next.js proxies to the backend. This keeps
HttpOnly session cookies on the customer app host so both API requests and
protected page navigation receive them. Production must be served over HTTPS
because the backend sets Secure cookies.

The legacy absolute `NEXT_PUBLIC_API_URL` is supported as a proxy destination
when `BACKEND_URL` is unset; it no longer sends browser requests across domains.
Rebuild and restart after changing the backend URL.
