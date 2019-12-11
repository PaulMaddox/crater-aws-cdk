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
                deviceName: "/dev/sdf",
                volume: BlockDeviceVolume.ebs(2000),
            }],
        })

        // Allow SSH from anywhere
        asg.connections.allowFromAnyIpv4(ec2.Port.tcp(22));

        // Set up crater
        asg.addUserData("mkfs -t xfs /dev/nvme1n1");
        asg.addUserData("mount /dev/nvme1n1 /root");
        asg.addUserData("mkdir -p /root/docker");
        asg.addUserData("ln -sf /root/docker /var/lib/docker");
        asg.addUserData("yum update -y");
        asg.addUserData("yum groupinstall 'Development Tools'");
        asg.addUserData("yum install -y git docker sqlite-devel openssl-devel");
        asg.addUserData("systemctl enable docker.service");
        asg.addUserData("systemctl start docker.service");
        asg.addUserData("docker pull rustops/crates-build-env");
        asg.addUserData("git clone https://github.com/rust-lang/crater");
        asg.addUserData("curl https://static.rust-lang.org/rustup/dist/x86_64-unknown-linux-gnu/rustup-init >/tmp/rustup-init");
        asg.addUserData("chmod +x /tmp/rustup-init");
        asg.addUserData("/tmp/rustup-init -y --no-modify-path --default-toolchain stable --profile minimal");
        asg.addUserData("export PATH=/root/.cargo/bin:$PATH")

    }

}