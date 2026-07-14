# Database Architecture

Version: 1.1

Status: Audit / Design

Last Updated: 2026-07-08

Author:
Paul Wu + ChatGPT

---

# Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2026-07-08 | Added production database audit, corrected table meanings, added Gen1 → Gen2 database evolution analysis |
| 1.0 | 2026-07-08 | Initial database architecture definition |

---


# Overview

This document describes the database evolution from TOP Gen1 to TOP Platform.


# Current Production Database

Source:

WeChat Cloud MySQL


Tables:

- tournaments
- matches
- players
- pairings
- player_partners
- player_opponents
- nhpa_global_referees
- nhpa_waivers
- nhpa_store
- nhpa_global_match_logs


# Domain Mapping


## Competition Engine

| Table | Description |
|---|---|
| tournaments | Tournament information |
| matches | Match records |
| players | Player information |
| pairings | Fixed pairing |
| player_partners | Current tournament partner assignment |
| player_opponents | Current tournament opponent tracking |


## Operations Engine

| Table | Description |
|---|---|
| nhpa_global_referees | Referee management |
| nhpa_waivers | Waiver management |
| nhpa_store | Competition data storage (to be analyzed) |


## System Service

| Table | Description |
|---|---|
| nhpa_global_match_logs | Match operation logs |


# Migration Principle

Database migration follows business domains, not table copying.

---


## Production Database Comparison

Current production database contains:

### Competition Domain

- tournaments
- players
- matches
- pairings
- player_partners
- player_opponents


### Operations Domain

- nhpa_global_referees
- nhpa_waivers


### System Domain

- nhpa_global_match_logs


## Modern Database Status

Modern database currently implements:

Competition Core only.

Included:

- tournaments
- players
- matches
- pairings
- player_partners
- player_opponents


Operations and System domains will be designed separately.

---

# Migration Principle

Existing production tables are references, not direct migration targets.

New architecture follows:

Business Domain → Engine → Service → Database Model