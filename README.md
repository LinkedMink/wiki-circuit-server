# Wiki Circuit Task Processor

## Project Overview
Wiki Circuit allows users to analyze connectivity between Wikipedia articles. The application downloads an initial input
article. From this input, it will find all the links to other articles inside the body and download the linked articles. 
It will precede to download articles in a recursive fashion upto a specified depth. The links will be parsed and counted 
to build a map of which articles are linked to each other. 

In a web user interface, the generated data is used to display diagrams to visualize the linkage between articles. The user
can select diagram segments to drill down into the data in a more detail. The UI piece is still a work in progress.

Wiki Circuit requires two components to function:

* [https://github.com/LinkedMink/wiki-circuit-client](https://github.com/LinkedMink/wiki-circuit-client)
* [https://github.com/LinkedMink/wiki-circuit-server (Current Project)](https://github.com/LinkedMink/wiki-circuit-server)

Note that the code was never written to be production ready. It was written mainly to demonstrate the various technologies
used to build the software.

## Server Project
This project host an API for managing jobs that download Wikipedia article data and builds a map of which articles link to 
each other. The project includes routes to start a job, get the result/status, and view an index of all jobs in progress. 

### Sample App
Try it out: [http://wiki-circuit.linkedmink.space/](http://wiki-circuit.linkedmink.space/)

## Scripts
To run the application, install yarn globally.

```bash
npm install -g yarn
```

## Deployment
There is no requirement to run on docker, but the project has been configured to do so if desired. Install 
the development dependencies for both the server and client.

```bash
npm install -g cross-env
cd ./wiki-circuit-server
npm install
cd ../wiki-circuit-client
npm install
```

Containerize both the server and client application. You will have to set the server URL at build time for 
the client app since it's contained in the built bundle.

```bash
cd ./wiki-circuit-server
npm run containerize
cd ../wiki-circuit-client
npx cross-env REACT_APP_SERVER_BASE_URL=https://api.mydomain.com:55000 \
  npm run containerize
```

Run the containers on the target machine. Networking can be configured by environmental variables.

```bash
docker run -d \
  -p 55000:8080 \
  -e ALLOWED_ORIGINS=http://mydomain.com:8080 \
  --name wiki-circuit-server \
  linkedmink/wiki-circuit-server

docker run -d \
  -p 8080:80 \
  --name wiki-circuit-client \
  linkedmink/wiki-circuit-client
```

The project contains a sample deployment.yaml file for deploying to a Kubernetes cluster. Edit the 
file as necessary. Then apply the changes to your cluster.

```sh
docker push linkedmink/wiki-circuit-server
docker push linkedmink/wiki-circuit-client
kubectl apply -f ./deployment.yaml
```

