# How we sped up the rust compiler tests from 1 week to ...?

## Introduction

## Baseline

The rust project uses a single c5.2xlarge instance, using on-demand pricing, and kept running 24/7.

The c5.2xlarge instance type has 8 vCPUs, 16GB RAM and a 2TB EBS voulme attached to it.  

Instance:       $248.20/month
EBS Volume:     $200.00/month
Total:          $448.20/month

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
```

## Scaling Vertically

As an experiment, lets start by just scaling up the instance size to something huge.

While this won't help us stay within the "same price or less" criteria, it will give a guideline for what is possible by just throwing hardware at the problem.

The i3en.24xlarge instance type has 96 vCPUs, 768GB RAM, and 8x 7500GB NVMe SSDs (so no need for EBS).

Instance:       $7,919.04/month
EBS Volume:     $0/month
Total:          $7,919.04/month