# SAP BTP Deployment Guide

This project is prepared for SAP BTP Cloud Foundry deployment with:

- CAP backend in `srv/`
- HANA production database
- XSUAA authentication
- AppRouter for interactive login
- UI5/Fiori apps served through the CAP/UI5 build

## 1. Prerequisites

- SAP BTP subaccount with Cloud Foundry environment enabled
- Cloud Foundry CLI installed
- Multi-Target Application (MTA) build tool installed
- Node.js 22 or newer
- Entitlements for:
  - SAP HANA Cloud
  - Authorization and Trust Management service (XSUAA)

## 2. Install Project Dependencies

From the project root:

```sh
npm install
```

## 3. Review Security Descriptor

The role setup for XSUAA is defined in [`xs-security.json`](./xs-security.json).

Roles in this project:

- `HRAdmin`
- `HRManager`
- `ITAdmin`
- `Employee`

These roles match the CAP authorization rules in [`srv/onboarding-service.cds`](./srv/onboarding-service.cds).

## 4. Build the Production Artifacts

Generate the production-ready build output:

```sh
npx cds build --production
```

This creates:

- `gen/srv` for the CAP service
- `gen/db` for the HANA artifacts

## 5. Build the MTA Archive

Build the deployable MTAR file:

```sh
mbt build
```

The archive is created in:

```text
mtar_archives/
```

## 6. Log In to Cloud Foundry

```sh
cf login
```

Then target your org and space:

```sh
cf target -o <org> -s <space>
```

## 7. Deploy to SAP BTP

Deploy the generated MTAR:

```sh
cf deploy mta_archives/employee-onboarding-platform_1.0.0.mtar
```

If your archive name differs, use the file name generated in `mta_archives/`.

## 8. Assign Role Collections

After deployment:

1. Open the SAP BTP cockpit.
2. Go to your subaccount.
3. Open `Security` > `Role Collections`.
4. Create or update role collections for:
   - `HRAdmin`
   - `HRManager`
   - `ITAdmin`
   - `Employee`
5. Add the application roles from the deployed XSUAA instance.
6. Assign the role collections to the users who should access the app.

## 9. Open the AppRouter URL

Use the route exposed by the AppRouter, not the CAP service URL directly.

The AppRouter is what triggers the interactive XSUAA login flow.

## 10. Expected Result

When a user opens the AppRouter URL:

- XSUAA shows the login page
- CAP receives the JWT token after login
- The dashboard reads `/api/me`
- UI navigation options are shown based on role

## 11. Local Development

For local development, keep using:

```sh
npm run watch
```

Local runs still use mocked users defined in [`package.json`](./package.json).

## 12. Common Issues

- If you do not see a login page, you are likely opening the CAP service URL instead of the AppRouter URL.
- If deployment fails because of missing services, check the subaccount entitlements for HANA and XSUAA.
- If role-based navigation looks wrong, verify the role collection assignment in the BTP cockpit.

