# wsb-project-cloud-app


## Technologies used

IaC -> CloudFormation with CDK framework written in TypeScript

Frontend -> React with TypeScript


## Architecture

Frontend app deployed in docker container on EC2 instance connected to the RDS PostgreSQL Database.
Scaling was implemented for frontend apps by ECS orchestrator, whereas for Database scaling was achieved by scaling read replicas.


## Deployment

### Requirements

1. AWS Account with user/role allowed to deploy these resources (`admin access` recommended).
2. `aws-cdk` package installed.

### How to deploy?

(optional)
Check what changes are going to be done on AWS using this command in `/cdk` directory:
```
cdk diff cdk-stack
```

In the `/cdk` directory run:
```
cdk deploy cdk-stack
```

