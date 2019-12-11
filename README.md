# How we sped up the rust compiler test cycle from 1 week to ...?

## Introduction

I recently watched a great talk delivered by
 [Pietro Albini](https://twitter.com/pietroalbini), one of the Rust core team members. It talked about how Rust ships a new release of their compiler every two weeks.

[![Shipping a stable compiler every six weeks](http://img.youtube.com/vi/As1gXp5kX1M/0.jpg)](http://www.youtube.com/watch?v=As1gXp5kX1M "Shipping a stable compiler every six weeks")

 Compared to other languages, this is quite a feat:

 ![shipping_schedule](https://imgur.com/u4TLHgr.png)

One of the reasons the Rust team can release at such a frequency, is their test suite. It uses a open source tool called [crator](https://github.com/rust-lang/crater) to automatically build, and test a huge number of popular crates from both [crates.io](https://crates.io), and [https://github.com](GitHub) against new Rust releases.

At the time of writing, this means that every Rust release candidate is tested against 84,389 crates (52,199 from GitHub, and 32,190 from crates.io).

One of the key takeaways I took from the talk, was that **these test runs take around a week**. They currently run on a single AWS EC2 instance (as well as a single Microsoft Azure instance). 

Curiousity got the better of me and I started thinking, could this be improved? Could we shorten these test cycle runs, while keeping the total cost the same? This feels like an [embarrassingly parallel](https://en.wikipedia.org/wiki/Embarrassingly_parallel) problem, well suited to horizontal scaling. Could we shard over lots of EC2 instances? What about technologies such as [AWS Lambda](https://aws.amazon.com/lambda/)?

As an [AWS employee](https://www.linkedin.com/in/paul-maddox/), I have the benefit of being able to experiment with AWS services in an account that I am not directly billed for. While there is an emphasis on [frugality](https://www.amazon.jobs/en/principles) at Amazon, being able to experiment and improve these test cycle times at no cost to the Rust team is of benefit to the whole community. 

This post outlines my journey...

## Baseline

Before we can start experimenting with possible improvements, we need to establish a baseline. How long does the current Rust test run take, and how much does it cost?

The rust project uses a single c5.2xlarge instance, using on-demand pricing, and kept running 24/7.

The `c5.2xlarge` instance type has 8 vCPUs, 16GB RAM and a 2TB EBS voulme attached to it.  

```
Instance:       $248.20/month
EBS Volume:     $200.00/month
Total:          $448.20/month
```

![htop_c5.2xlarge](https://imgur.com/wSSfNl9.png)

On this setup, running a full test run takes:

```
# 
$ time cargo run -- prepare-local
real	3m10.049s
user	9m46.007s
sys	0m28.302s

# Compile and test all crates
$ cargo run -- define-ex --ex full --crate-select=full --cap-lints=forbid stable beta
$ date
Wed Dec 11 09:29:18 UTC 2019
$ time cargo run -- run-graph --ex full --threads 8

# Tests still running... estimates below:
# Packages Total:                 84,379
# Packages Processed:             1,014
# Start Timestamp:                1576056558 
# Current Timestamp:              1576063553
# Elapsed Duration:               6995 seconds
# Packages per Second:            0.1449606862  
# Estimated time till completion: 6.73 days

```

Given that a test run takes just under 1 week to complete, and the current Rust configuration is to leave use a single instance, left running 24/7 - that means that there is a limit of 4 test runs per month. 

We can calculate the total cost per test run to be the monthly cost of the instance + EBS / 4.

**Total cost per test run: $112.05**

## Scaling Vertically

As an experiment, lets start by just scaling up the instance size to something huge.

While this won't help us stay within the "same price or less" criteria, it will give a guideline for what is possible by just throwing hardware at the problem. It gives a good indication of how much of the testing is resource bound (CPU, memory, IO etc) vs. lock bound (waiting for Cargo locks etc). 

The `i3en.24xlarge` instance type has 96 vCPUs, 768GB RAM, and 8x 7500GB NVMe SSDs (so no need for EBS).

```
Instance:       $7,919.04/month
EBS Volume:     $0/month
Total:          $7,919.04/month
```

Wheeey, look at all of those CPUs go...

![htop_i3en.24xlarge](https://imgur.com/avTgN9N.png)

On this setup, running a full test run takes:

```
# 
$ time cargo run -- prepare-local
real    2m39.653s
user    8m1.185s
sys     0m32.680s

# Compile and test all crates
$ cargo run -- define-ex --ex full --crate-select=full --cap-lints=forbid stable beta
$ date
Wed Dec 11 10:19:24 UTC 2019
$ time cargo run -- run-graph --ex full --threads 96

# Tests still running... estimates below:
# Packages Total:                     84,389
# Packages Processed:                 4,821
# Start Timestamp:                    1576059564
# Current Timestamp:                  1576063231
# Elapsed Duration:                   3667 seconds
# Packages per Second:                1.31469866376
# Estimated seconds for completion:   17.83 hours
```

**Total cost per test 18 hour test run: $195.264**

## Scaling Horizonally on Amazon EC2

WIP. Rough plan: 

 - Using Spot? How much does caching actually matter?
 - Spot cost of the `i3en.24xlarge` is $3.2544 which would mean each full test run would come in at 18hrs with a cost of $58.57
...

## Scaling Horizontally on AWS Lambda

WIP. Rough plan:

 - Use [aws-lambda-container-image-converter](https://github.com/awslabs/aws-lambda-container-image-converter) to create Lambda layers from the required docker images
 - Create a [Step Function](https://aws.amazon.com/step-functions/) that enumerates all of the crates to build and test, and then runs a single Lambda invoke for each crate build/test. Aggregate results, and combine to a single SQLite database and generate report.
 
 Caveats: 

 - Caching?
 - Limited to 15mins for the build and test of each package.
 - Default Lambda limits allow 1,000 concurrent crates to be tested. If we assume that we can test 0.14 crates per second (the rate we get from c5.2xlarge for lack of better data), then we are probably looking at around 7 seconds per crate and a total test run time of around 1 minute if my napkin calculations are correct...
  - The cost for the above would be around $30 per test run

## Conclusion

... some pretty cost vs time graph ...

