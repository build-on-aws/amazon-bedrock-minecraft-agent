import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as path from 'path';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class ServerStack extends cdk.Stack {
  public readonly server_port = 25565
  public readonly vpc: ec2.Vpc;
  public readonly botName = "Rocky"
  public readonly agentAliasID: string;
  public readonly agentID: string;

  constructor(scope: Construct, id: string, props ? : cdk.StackProps) {
    super(scope, id, props);

    // Retrieve context variables
    this.agentAliasID = this.node.tryGetContext('agentAliasID');
    this.agentID = this.node.tryGetContext('agentID');

    // Check if context variables are provided
    if (!this.agentAliasID) {
      throw new Error('Context variable "agentAliasID" is required');
    }
    if (!this.agentID) {
      throw new Error('Context variable "agentID" is required');
    }

    // VPC
    this.vpc = new ec2.Vpc(this, 'MinecraftVPC', {
      maxAzs: 2,
      natGateways: 1,
    });

    // Security Group
    const minecraftSecurityGroup: ec2.SecurityGroup = new ec2.SecurityGroup(
      this,
      'MinecraftServerSecurityGroup', {
        vpc: this.vpc,
        description: 'Security group for Minecraft server',
        allowAllOutbound: true,
      }
    );

    // Add security group rules
    minecraftSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(this.server_port),
      'Allow inbound TCP traffic on minecraft port'
    );

    // Create a new ECS cluster
    const cluster = new ecs.Cluster(this, 'MyCluster', {
      vpc: this.vpc,
      clusterName: 'MinecraftServerCluster', // optional
      containerInsights: true, // optional
    });

    //ecs task definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'MinecraftServerTaskDefinition', {
      memoryLimitMiB: 16384,
      cpu: 4096,

    });

    // create a container and add the task definition
    const container = taskDefinition.addContainer('MinecraftServerContainer', {
      image: ecs.ContainerImage.fromRegistry('itzg/minecraft-server:latest'),
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'minecraft-server'
      }),
      portMappings: [{
        containerPort: this.server_port,
        hostPort: this.server_port,
        protocol: ecs.Protocol.TCP
      }],
      environment: {
        EULA: 'TRUE',
        VERSION: "1.20.1",
        SERVER_PORT: this.server_port.toString(),
        MODE: "creative",
        DIFFICULTY: "peaceful",
        ONLINE_MODE: "FALSE",
        ALLOW_CHEATS: "TRUE",
        LEVEL_TYPE: "FLAT",
        ALLOW_FLIGHT: "TRUE"
      },
      healthCheck: {
        command: ['CMD-SHELL', `netstat -an | grep ${this.server_port} > /dev/null || exit 1`],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
        startPeriod: Duration.seconds(300), // 5 minutes
      },

    });

    container.addMountPoints({
      containerPath: '/data',
      sourceVolume: 'minecraft-data',
      readOnly: false,
    });

    taskDefinition.addVolume({
      name: 'minecraft-data',
    });

    const minecraft_service = new ecs_patterns.NetworkLoadBalancedFargateService(this, 'MinecraftServerService', {
      cluster,
      taskDefinition,
      publicLoadBalancer: true,
      desiredCount: 1,
      listenerPort: this.server_port,
      assignPublicIp: false,
      healthCheckGracePeriod: Duration.minutes(5),
      securityGroups: [minecraftSecurityGroup],
    });

    new cdk.CfnOutput(this, 'MinecraftServerUrl', {
      value: minecraft_service.loadBalancer.loadBalancerDnsName,
      description: 'The URL of the Minecraft server',
      exportName: 'MinecraftServerUrl',
    })

    /**
     * Next create the node agent task
     */

    const agentTaskDefinition = new ecs.FargateTaskDefinition(this, 'NodeAgentTaskDefinition', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    const agentContainer = taskDefinition.addContainer('NodeAgentContainer', {
      image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../../agent_ts')),
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'node-agent'
      }),
      command: ['node', 'agent.js'],
      environment: {
        "MINECRAFT_NLB_DNS_NAME": minecraft_service.loadBalancer.loadBalancerDnsName,
        "MINECRAFT_SERVER_PORT": this.server_port.toString(),
        "MINECRAFT_BOT_USERNAME": this.botName,
        "AGENT_ALIAS_ID": this.agentAliasID,
        "AGENT_ID": this.agentID,
      },
      healthCheck: {
        command: ["CMD-SHELL", "echo 'foo' || exit 0"],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
        startPeriod: Duration.seconds(60), // 1 minutes
      },
      portMappings: [{
        containerPort: 3000,
        hostPort: 3000,
        protocol: ecs.Protocol.TCP
      }]
    })


    /**
     * Create the right access policies
     */

    const nodeAgentTaskRole = new iam.Role(this, 'NodeAgentTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'IAM role for Node Fargate task that calls Bedrock',
    });

    const bedrockPolicyDocument = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: [
            'bedrock:Invoke*'
          ],
          resources: ['*'], // Adjust the resource ARN as needed
          effect: iam.Effect.ALLOW
        })
      ]
    });

    // Create an IAM policy using the custom policy document
    const bedrockPolicy = new iam.Policy(this, 'BedrockPolicy', {
      policyName: 'BedrockRuntimeAccessPolicy',
      document: bedrockPolicyDocument,
    });

    // Attach the custom policy to the IAM role
    nodeAgentTaskRole.attachInlinePolicy(bedrockPolicy);


    const nodeAgentTaskExecutionRole = new iam.Role(this, 'NodeAgentTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'IAM role for Node Agent Fargate task execution to bedrock',
    });

    nodeAgentTaskExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
    );

  }

}