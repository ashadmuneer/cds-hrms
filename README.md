# Employee Onboarding Platform

Portfolio-quality SAP CAP and Fiori Elements application for managing employee onboarding.

## Run locally

```sh
npm install
npm run watch
```

Open `http://localhost:4004` and sign in with one of the mocked users:

- `hr.admin`
- `hr.manager`
- `it.admin`
- `employee`

The CAP service is available at `/odata/v4/onboarding`.

## Role-based dashboard

- Open `http://localhost:4004/dashboard/test/flpSandbox.html#dashboard-tile` to test the dashboard with FLP-style navigation.
- The dashboard now calls `/api/me` to resolve the current user and show only the apps that fit the assigned role.
- Local development keeps mocked users in `package.json`, while production is configured for XSUAA through `xs-security.json`.

## Production deployment

- Follow the step-by-step guide in [`BTP_DEPLOYMENT.md`](./BTP_DEPLOYMENT.md).
- Deploy through the AppRouter defined in [`mta.yaml`](./mta.yaml).
- The AppRouter in [`app/router/xs-app.json`](./app/router/xs-app.json) sends the browser through XSUAA, which is what shows the real login page.
- After deployment, open the AppRouter route, not the CAP service URL directly. The AppRouter handles the login redirect and forwards the JWT to CAP.
