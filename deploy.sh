#/bin/sh

IMAGE_NAME="wiki-circuit-server"

if [ -z "$DOCKER_SCOPE" ]; then
  DOCKER_SCOPE="linkedmink/" 
fi

if [ -z "$DOCKER_REGISTRY" ]; then
  DOCKER_REGISTRY="" 
fi

npm run containerize

docker tag \
  "${DOCKER_SCOPE}${IMAGE_NAME}" \
  "${DOCKER_REGISTRY}${DOCKER_SCOPE}${IMAGE_NAME}:latest"

kubectl set image \
  "deployment/${IMAGE_NAME}" \
  $IMAGE_NAME="${DOCKER_REGISTRY}${DOCKER_SCOPE}${IMAGE_NAME}"

sleep 1

docker push "${DOCKER_REGISTRY}${DOCKER_SCOPE}${IMAGE_NAME}:latest"

kubectl set image \
  "deployment/${IMAGE_NAME}" \
  $IMAGE_NAME="${DOCKER_REGISTRY}${DOCKER_SCOPE}${IMAGE_NAME}:latest" \
  --record

kubectl rollout status "deployment/${IMAGE_NAME}"
