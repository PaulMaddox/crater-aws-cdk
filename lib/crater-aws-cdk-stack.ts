import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import { Crater } from './creater';

export class CraterAwsCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // Deploy to the default vpc
    const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
      isDefault: true,
    })

    const crator = new Crater(this, 'Crater', {
      vpc,
      instanceType: "c5.2xlarge",
      keyName: "pmaddox@amazon.com"
    });


  }
}
