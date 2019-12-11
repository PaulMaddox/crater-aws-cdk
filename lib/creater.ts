import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import autoscaling = require('@aws-cdk/aws-autoscaling');
import { Vpc, AmazonLinuxImage, AmazonLinuxGeneration } from '@aws-cdk/aws-ec2';

export interface CraterProps {
    vpc: ec2.IVpc,
    instanceType: string,
    keyName: string,
}

export class Crater extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string, props: CraterProps) {
        super(scope, id);

        const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
            vpc: props.vpc,
            keyName: props.keyName,
            instanceType: new ec2.InstanceType(props.instanceType),
            machineImage: new AmazonLinuxImage({
                generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
            }),
        })

        asg.connections.allowFromAnyIpv4(ec2.Port.tcp(22));

    }

}