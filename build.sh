#/bin/sh

IMAGE_NAME="wiki-circuit-server"
ARCHITECTURES="linux/amd64,linux/arm/v7"

if [ -z "$DOCKER_SCOPE" ]; then
  DOCKER_SCOPE="linkedmink/" 
fi

if [ -z "$DOCKER_REGISTRY" ]; then
  DOCKER_REGISTRY="registry.linkedmink.space/" 
fi

if [ -z "$KUBERNETES_NAMESPACE" ]; then
  KUBERNETES_NAMESPACE="wiki-circuit" 
fi

npm run build

if [ "$1" = "deploy" ]; then
  kubectl set image \
    "deployment/${IMAGE_NAME}" \
    $IMAGE_NAME="${DOCKER_REGISTRY}${DOCKER_SCOPE}${IMAGE_NAME}" \
    --namespace="${KUBERNETES_NAMESPACE}"
fi

docker buildx build \
  --platform "${ARCHITECTURES}" \
  --build-arg SSH_PRIVATE_KEY="$(cat ~/.ssh/id_rsa)" \
  -t "${DOCKER_REGISTRY}${DOCKER_SCOPE}${IMAGE_NAME}:latest" \
  --push .

if [ "$1" = "deploy" ]; then
  sleep 1

  kubectl set image \
    "deployment/${IMAGE_NAME}" \
    $IMAGE_NAME="${DOCKER_REGISTRY}${DOCKER_SCOPE}${IMAGE_NAME}:latest" \
    --namespace="${KUBERNETES_NAMESPACE}" \
    --record

  kubectl rollout status \
    "deployment/${IMAGE_NAME}" \
    --namespace="${KUBERNETES_NAMESPACE}"
fi
