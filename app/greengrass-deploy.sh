# !/bin/sh

npm run build

GG_NAME=mh-z19
GG_ID=$(aws greengrass list-groups --query "Groups[?Name==\`${GG_NAME}\`].Id" --output text)

if [ -n "$GG_ID" ]; then
    yes | cdk destroy --all
    yes | aws greengrass reset-deployments --group-id ${GG_ID} --force
fi

yes | cdk deploy GreengrassStack

GG_ID=$(aws greengrass list-groups --query "Groups[?Name==\`${GG_NAME}\`].Id" --output text)
GG_VERSION=$(aws greengrass list-groups --query "Groups[?Name==\`${GG_NAME}\`].LatestVersion" --output text)
GG_DEPLOYMENT_ID=$(aws greengrass create-deployment --deployment-type NewDeployment --group-id $GG_ID --group-version-id $GG_VERSION --query "DeploymentId" --output text)

aws greengrass get-deployment-status --group-id ${GG_ID} --deployment-id ${GG_DEPLOYMENT_ID}
