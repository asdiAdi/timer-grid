# TimerGrid

Browser multi-timer with a command-bar input. Timers persist in `localStorage` and keep running while the site is closed.

- Add one or many timers: `5m eggs`, `1h30m, 90s, 1:30`
- Pause, resume, stop, delete, toggle, repeat — by label or `all`
- Static site, no backend or login

Live: `https://timergrid.carladi.com`

## Run locally

Requires Node 20 + npm.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

## Deploy

Infra is AWS CDK in `infra/index.ts`

```sh
npm run synth
npm run deploy
```

Push to `main` deploys automatically via `.github/workflows/deploy.yml`: build → `cdk deploy` → `aws s3 sync dist/` → CloudFront invalidation. Bucket ID, distribution ID come from SSM `/timer-grid/github-action/prod/*`; role/region from `AWS_ROLE_TO_ASSUME` / `AWS_REGION`.
