# How we increased the Rust compiler test times from x to y

## Introduction

## Baseline

The rust project uses a single c5.2xlarge instance, using on-demand pricing, and kept running 24/7.

The c5.2xlarge instance type has 8 vCPUs, 16GB RAM and a 2TB EBS voulme attached to it.  

Instance:       $248.20/month
EBS Volume:     $200.00/month
Total:          $448.20/month

On this setup, running a full test run takes