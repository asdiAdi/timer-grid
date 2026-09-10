import { StaticSiteStack } from "@asdi/aws-infra";
import * as cdk from "aws-cdk-lib";

const app = new cdk.App();

new StaticSiteStack(app, "TimerGridStack", {
  env: {
    account: "882357180990",
    region: "us-east-1", //default,
  },
  staticSite: {
    secondLevelDomain: "carladi.com",
    subDomain: "timergrid",
    githubName: "asdiAdi",
    githubRepo: "timer-grid",
    tableName: "gh_site_secrets",
  },
});
