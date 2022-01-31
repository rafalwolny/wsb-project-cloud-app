import { CdkStack, CdkStackProps } from "../lib/cdk-stack";
import { App } from "aws-cdk-lib";

const app = new App;

const cdkStackProps: CdkStackProps = {
    dBName: "my-db",
    dbClusterIdentifier: "cdk-stack-dbCluster",

    dbScalingMaxCapacity: 2,
    dbScalingMinCapacity: 0,
    dbScalingSteps:[
        { upper: 60, change: -1 },
        { lower: 80, change: +1 }
    ],
    dbScalingResourceId: "cluster:cdk-stack-dbCluster",
    dbScalingScalableDimension: "rds:cluster:ReadReplicaCount",

    ec2InstanceType: "t3.micro",
    minCapacity: 1,
    maxCapacity: 2,

    dockerfilePath: "../../Dockerfile",
}

const cdkStack = new CdkStack(app, "cdk-stack", cdkStackProps)
