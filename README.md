# Fees and Revenue

### Cloning
Clone this repo with `git clone --recursive`. If you have already cloned it use `git submodule update --init`

### Table

| PK (S)       | SK (N)          | [chain]              |
| ------------ | --------------- | -------------------- |
| #df#dex#[id] | [unixTimestamp] | {[version]:[volume]} |
| #dr#dex#[id] | [unixTimestamp] | {[version]:[volume]} |

df = daily fees
dr = daily revenue

_for now, there are only DEX fees, more to come soon_

### Protocol ids

Taken from `protocols/data` matching category

### Adding a new adapter

To add a new adapter
- write adapter to `src/adaptors`, helpful to reference existing ones
- add adapter path to `src/adaptors/index`, and `utils/adaptors`
- test using `script/test` with protocol id
