#/bin/sh

IMAGE_NAME="wiki-circuit-server"
ARCHITECTURES="linux/amd64,linux/arm/v7"

if [ -z "$DOCKER_SCOPE" ]; then
  DOCKER_SCOPE="linkedmink/" 
fi

if [ -z "$DOCKER_REGISTRY" ]; then
  DOCKER_REGISTRY="" 
fi

npm run build

if [ "$1" == "push" ]; then
  kubectl set image \
    "deployment/${IMAGE_NAME}" \
    $IMAGE_NAME="${DOCKER_REGISTRY}${DOCKER_SCOPE}${IMAGE_NAME}"
fi

docker buildx build \
  --platform "${ARCHITECTURES}" \
  -t "${DOCKER_REGISTRY}${DOCKER_SCOPE}${IMAGE_NAME}:latest" \
  --push .

if [ "$1" == "push" ]; then
  sleep 1

  kubectl set image \
    "deployment/${IMAGE_NAME}" \
    $IMAGE_NAME="${DOCKER_REGISTRY}${DOCKER_SCOPE}${IMAGE_NAME}:latest" \
    --record

  kubectl rollout status "deployment/${IMAGE_NAME}"
fi
