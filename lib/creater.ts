import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import autoscaling = require('@aws-cdk/aws-autoscaling');
import { Vpc, AmazonLinuxImage, AmazonLinuxGeneration } from '@aws-cdk/aws-ec2';
import { BlockDeviceVolume, UpdateType } from '@aws-cdk/aws-autoscaling';

export interface CraterProps {
    vpc: ec2.IVpc,
    instanceType: string,
    keyName: string,
}

export class Crater extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string, props: CraterProps) {
        super(scope, id);

        // Create a single EC2 instance, in an auto scaling group
        const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
            vpc: props.vpc,
            keyName: props.keyName,
            updateType: UpdateType.REPLACING_UPDATE,
            instanceType: new ec2.InstanceType(props.instanceType),
            machineImage: new AmazonLinuxImage({
                generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
            }),
            blockDevices: [{
                deviceName: "/dev/nvme1n1",
                volume: BlockDeviceVolume.ebs(2000),
            }],
        })

        // Allow SSH from anywhere
        asg.connections.allowFromAnyIpv4(ec2.Port.tcp(22));

        // Setup the instance ready for crater
        // asg.addUserData("growpart /dev/nvme0n1 1");
        // asg.addUserData("resize2fs /dev/nvme0n1p1");
        asg.addUserData("yum update -y");
        asg.addUserData("yum install -y git docker");
        asg.addUserData("systemctl enable docker.service");
        asg.addUserData("systemctl start docker.service");
        asg.addUserData("docker pull rustops/crates-build-env:latest");

    }

}