import { Stack, StackProps } from "aws-cdk-lib";
import { aws_autoscaling as autoscaling } from "aws-cdk-lib";
import { aws_applicationautoscaling as applicationautoscaling } from "aws-cdk-lib";
import { aws_cloudwatch as cloudwatch } from "aws-cdk-lib";
import { aws_ec2 as ec2 } from "aws-cdk-lib";
import { aws_ecs as ecs } from "aws-cdk-lib";
import { aws_rds as rds } from "aws-cdk-lib";
import { AuroraPostgresEngineVersion } from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";

export type CdkStackProps = StackProps & {
    dbClusterIdentifier: string;
    dBName: string;

    dbScalingMaxCapacity: number;
    dbScalingMinCapacity: number;
    dbScalingResourceId: string;
    dbScalingScalableDimension: string;
    dbScalingSteps:[
        { upper: number; change: number },
        { lower: number; change: number }
    ];

    ec2InstanceType: string;
    minCapacity: number;
    maxCapacity: number;

    dockerfilePath: string;
}

export class CdkStack extends Stack {
    constructor(scope: Construct, id: string, props: CdkStackProps) {
        super(scope, id, props)

        const natGatewayProvider = ec2.NatProvider.instance({
            instanceType: new ec2.InstanceType("t3.nano"),
        });

        const vpc = new ec2.Vpc(this, "VPC", {
            maxAzs: 1,
            natGatewayProvider,
            subnetConfiguration: [
                {
                    name: "private",
                    subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
                },
                {
                    name: "public",
                    subnetType: ec2.SubnetType.PUBLIC,
                },
            ],
        });

        const dbCluster = new rds.DatabaseCluster(this, "dbCluster", {
            cloudwatchLogsExports: [],
            clusterIdentifier: props.dbClusterIdentifier,
            defaultDatabaseName: props.dBName,
            engine: rds.DatabaseClusterEngine.auroraPostgres({
                version: AuroraPostgresEngineVersion.of(
                    "13.3",
                    "13"
                ),            
            }),
            instances: 1,
            instanceProps: {
                vpc: vpc,
                vpcSubnets: {
                    subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
                },
            },
        });

        const dbScaling = new applicationautoscaling.ScalableTarget(this, "dbClusterScaling",{
                maxCapacity: props.dbScalingMaxCapacity,
                minCapacity: props.dbScalingMinCapacity,
                resourceId: props.dbScalingResourceId,
                scalableDimension: props.dbScalingScalableDimension,
                serviceNamespace: applicationautoscaling.ServiceNamespace.RDS,
        });

        dbScaling.scaleOnMetric("dbClusterScalingOnMetric", {
            metric: dbCluster.metricCPUUtilization({
                unit: cloudwatch.Unit.PERCENT,
            }),
            scalingSteps: props.dbScalingSteps,
            adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
        });

        const autoScalingGroup = new autoscaling.AutoScalingGroup(this, "autoScalingGroup", {
            instanceType: new ec2.InstanceType(props.ec2InstanceType),
            machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
            minCapacity: props.minCapacity,
            maxCapacity: props.maxCapacity,
            vpcSubnets: vpc.selectSubnets({
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
            }),
            vpc,
        });

        const asgCapacityProvider = new ecs.AsgCapacityProvider(this, "asgCapacityProvider",{
                autoScalingGroup: autoScalingGroup,
        });

        const ecsCluster = new ecs.Cluster(this, "ecsCluster", {
            vpc: vpc,
        });

        ecsCluster.addAsgCapacityProvider(asgCapacityProvider);

        const taskDefinition = new ecs.Ec2TaskDefinition(this, "taskDefinition");

        const frontendContainer = taskDefinition.addContainer("frontendContainer", {
            image: ecs.ContainerImage.fromAsset(props.dockerfilePath)
        });
    }
}