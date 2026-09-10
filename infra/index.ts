import { StaticSiteStack } from "@asdi/aws-infra";
import * as cdk from "aws-cdk-lib";

const app = new cdk.App();

new StaticSiteStack(app, "TimerGridStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT!,
    region: "us-east-1", //default,
  },
  staticSite: {
    secondLevelDomain: "carladi.com",
    subDomain: "timergrid",
    github: {
      owner: "asdiAdi",
      ownerId: "80302904",
      repo: "timer-grid",
      repoId: "1352233635",
    },
    tableName: "gh_site_secrets",
  },
});
