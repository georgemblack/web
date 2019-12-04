---
title: Go Fast with Google Cloud Run
date: 2019-12-03T20:44:00-0600
layout: post
published: true
---

{% include image-alpha.html src="cloud-run-console" alt="Google Cloud Run web console" %}

Google's recently available [Cloud Run](https://cloud.google.com/run/), in my opinion, resembles the future of the developer experience on the cloud. Cloud Run (*fully managed flavor*) lets me build a containerized application, and just *run* it, without firing a single neuron to consider:

* Scaling
* Load balancing
* SSL
* Underlying infrastructure
* Vendor or product lock-in

<!--more-->

Usage is straightforward: you create a "service" with some minimal configuration options, then provide a container for the service to run. Your container must be stateless, and operate via an HTTP interface on `$PORT`. *That's it*.

It's the answer to *"I just want to run this container, can you do that for me? Fast?"*

My initial reaction was to compare Cloud Run to [AWS Fargate](https://aws.amazon.com/fargate/) – however, after working with it for a few days, I now understand it more closely competes with [AWS Lambda](https://aws.amazon.com/lambda/) and [Google Cloud Functions](https://cloud.google.com/functions/).

While Fargate will provision a continuously running container, Cloud Run will *only* allow your container to run for the duration of the request (similar to Lambda).

I think Cloud Run, *for the use case it's trying to solve*, has some strong advantages being a strange hybrid of Fargate and Lambda/Cloud Functions.

In the context of smaller projects without demands for complexity, this is why I'm falling for Cloud Run:

## Scale to Zero

For low-traffic applications, Fargate can be pricey. The CPU/memory is provisioned, and if unused, it is wasted.

A service with 0.25 vCPU and 0.5GB of memory will start you at ~$9/month. Yikes.

Because Cloud Run scales to zero when your container is lonely and sans traffic, you are not charged. Instead, its pricing is based on the number of requests and their execution times.

Pricing aside – the concept of it is impressive. When there is no traffic, *your container is not running*. When a request comes in, your container is loaded in a few dozen milliseconds, and ready to respond.

## Scale to Infinity (Or 80,000 Concurrent Requests)

With the default account quotas, you can run up to 10,000 containers at 80 concurrent requests per container. With the same velocity that it scales from 0 to 1, it scales from 1 to 10,000.

Scaling is fast, *which means you don't need to think about it*.

## It's Just a Container

This most obvious advantage of Cloud Run over Lambda or Cloud Functions is its use of standard containers:

* Unlike Lambda, you don't write your code to fit a specific structure defined by the platform.
* Your container is portable – no vendor or product lock-in.
* Write in your language – no need to stick to a list of supported languages and runtimes.
* Testing on your local machine is usually easier with containers.

## Managed Endpoints

Cloud Run will automatically provision an endpoint in which to access your service. (i.e. `https://my-service-abcdefg-ue.a.run.app/`). This URL does not change, even as new revisions are deployed.

Certificates are managed for you. If you attach a custom domain, Cloud Run will even provision a Let's Encrypt certificate. The only manual labor involves updating a few DNS records.

As a cherry on top, if your service is not public-facing, authentication can be handled with Google Cloud's IAM.

## Two Commands: Build and Run

Using the [`gcloud`](https://cloud.google.com/sdk/gcloud/) utility, I was able to integrate Cloud Run into my CI/CD environment with a few minimal commands.

The first uses [Cloud Build](https://cloud.google.com/cloud-build/) to build and upload the image:

```
gcloud builds submit \
	--tag gcr.io/my-project/my-image:1.0.0
```

The second creates a new revision of your Cloud Run service with the settings you specify. If your service doesn't already exist, it will be created.

```
gcloud run deploy my-service \
	--concurrency 20 \
	--max-instances 50 \
	--memory 128Mi \
	--platform managed \
	--service-account service-account@example.com \
	--region us-central1 \
	--image gcr.io/my-project/my-image:1.0.0
```

## Finding Its Role

Cloud Run (*fully managed*) can't handle much custom configuration – but I don't think that's the point. If your service can fit within its opinionated, limited structure, it will make your life *very easy*, and fast!

These are my first impressions, of course.

I'm really just getting started when it comes to understanding containers, and tools such as Kubernetes and Knative. I soon hope to have a stronger comprehension of what lies under-the-hood of services like Cloud Run, as I go deeper into the expanding universe of containers and container orchestration.

But for now, I'll let myself be in awe of its magic and simplicity.