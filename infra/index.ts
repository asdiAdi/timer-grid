import { StaticSiteStack, GithubDeployStack } from "@asdi/aws-infra";
import * as cdk from "aws-cdk-lib";

const app = new cdk.App();
const env = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT!,
    region: "us-east-1",
  },
};

const site = new StaticSiteStack(app, "TimerGridSiteStack", {
  ...env,
  secondLevelDomain: "carladi.com",
  subDomain: "timergrid",
});

const deploy = new GithubDeployStack(app, "TimerGridDeployStack", {
  ...env,
  roleName: "timer-grid-github-deploy",
  github: {
    owner: "asdiAdi",
    ownerId: "80302904",
    repo: "timer-grid",
    repoId: "1352233635",
    branch: "main",
  },
  managedPolicies: [site.staticSite.managedPolicy],
  ssmParameterPrefixes: ["/timer-grid/github-action/prod"],
});

new cdk.CfnOutput(site, "TimerGridBucket", {
  value: site.staticSite.bucket.bucketName,
  description: "put to ssm parameter github-action: S3_BUCKET",
});
new cdk.CfnOutput(site, "TimerGridDistributionId", {
  value: site.staticSite.distribution.distributionId,
  description: "put to ssm parameter github-action: CLOUDFRONT_DISTRIBUTION_ID",
});
new cdk.CfnOutput(deploy, "TimerGridRoleToAssume", {
  value: deploy.role.roleArn,
  description: "github action variable: AWS_ROLE_TO_ASSUME",
});
new cdk.CfnOutput(deploy, "TimerGridRegion", {
  value: deploy.region,
  description: "github action variable: AWS_REGION",
});
