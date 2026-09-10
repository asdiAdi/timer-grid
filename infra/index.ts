import { StaticSiteStack } from "@asdi/aws-infra";
import * as cdk from "aws-cdk-lib";

const app = new cdk.App();

new StaticSiteStack(app, "StaticSiteStack", {
  env: {
    account: "123456789012",
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
