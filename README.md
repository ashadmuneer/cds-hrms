# Employee Onboarding Platform
## 👥 Collaborators

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/ashadmuneer">
        <img src="https://github.com/ashadmuneer.png" width="100px;" alt="ashad muneer"/>
        <br />
        <sub><b>Ashad Muneer</b></sub>
      </a>
      <br />
    </td>
    <td align="center">
      <a href="https://github.com/Aman-bhai">
        <img src="https://github.com/Aman-bhai.png" width="100px;" alt="Aman-bhai"/>
        <br />
        <sub><b>Aman Soni</b></sub>
      </a>
      <br />
    </td>
    <td align="center">
      <a href="https://github.com/paritosh31mishra">
        <img src="https://github.com/paritosh31mishra.png" width="100px;" alt="paritosh"/>
        <br />
        <sub><b>Paritosh Mishra/b></sub>
      </a>
      <br />
    </td>
    <td align="center">
      <a href="https://github.com/SatsNik">
        <img src="https://github.com/SatsNik.png" width="100px;" alt="satender"/>
        <br />
        <sub><b>Satyendra Shukla</b></sub>
      </a>
      <br />
    </td>
  </tr>
</table>
Portfolio-quality SAP CAP and Fiori Elements application for managing employee onboarding.

## Run locally

```sh
npm install
npm run watchnpm install @sap/cds
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
