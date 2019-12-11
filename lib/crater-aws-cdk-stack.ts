import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import { Crater } from './crater';

export class CraterAwsCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // Deploy to the default vpc
    const vpc = ec2.Vpc.fromLookup(this, "VPC", {
      isDefault: true,
    })

    const baseline = new Crater(this, "Crater", {
      vpc,
      instanceType: "c5.2xlarge",
      keyName: "macbook",
      ebs: true,
    });

    const huge = new Crater(this, 'CraterHuge', {
      vpc,
      instanceType: "i3en.24xlarge",
      keyName: "macbook",
      ebs: false,
    })

  }
}
