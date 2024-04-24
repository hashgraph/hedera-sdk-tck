# TCK Development Process

This document is meant to describe and outline the process by which TCK tests are written and developed for a specific Hedera request type. Since the work for these TCK tests will not only be contained to this repo but also spread out amongst all the SDK repos, there will be a good amount of coordination required between all developers to make sure TCK and SDK work stays in parity with each other. The outline below will describe how tests should be documented, developed, and tested to keep this parity. This process is always open to changes at any point if the developers find better or more optimal ways to accomplish tasks.

## SDK Leads

Since the process outlined will require coordination across all SDKs, having a designated person to represent each SDK will help keep the communication consistent and will allow for everyone to know exactly who to speak to/require reviews from for the various development tasks. Currently, the SDK leads are:

| SDK                   | Lead           | Github handle      |
|-----------------------|----------------|--------------------|
| Javascript/Typescript |                | @svetoslav-nikol0v |
| Java                  | Nikita Lebedev | @thenswan          |
| Go                    | Ivan Ivanov    | @0xivanov          |
| C++                   | Rob Walworth   | @rwalworth         |
| Swift                 | Ricky Saechao  | @RickyLB           |
| Rust                  | Ricky Saechao  | @RickyLB           |

## Process

The TCK development process encompasses all work done for a Hedera request type, including documentation, development of tests, the actual testing of the tests, and finally synchronously merging all the work. 

## Step 1: Documentation

