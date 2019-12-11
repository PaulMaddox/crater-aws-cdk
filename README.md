# How we increased the Rust compiler test times from x to y

## Introduction

## Baseline

The rust project uses a single c5.2xlarge instance, using on-demand pricing, and kept running 24/7.

The c5.2xlarge instance type has 8 vCPUs, 16GB RAM and a 2TB EBS voulme attached to it.  

Cost: $0.34/hr instance costs + $0.10/GB EBS costs = $448.88/month

On this setup, running a 