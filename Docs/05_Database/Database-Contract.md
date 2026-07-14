# TOP Modern Database Contract v1.1

---
## Resion History

v1.1 2026-07-10 增加 Design Notes, 优化表格中players字段的职责

## Purpose

Define the database entities used by TOP Modern.

This document is the reference contract for:

- Repository Layer
- Service Layer
- API Layer


## Core Tables

| Table | Responsibility |
|---|---|
| tournaments | Tournament information |
| players | Tournament participants and current tournament runtime data |
| matches | Match lifecycle and results |
| pairings | Fixed pairing information |
| player_partners | Current tournament partner relationships |
| player_opponents | Current tournament opponent relationships |


## Notes

player_partners and player_opponents are not historical statistics.

They represent current tournament relationship data only.

Historical analytics will be designed separately.

## Design Notes

The players table currently represents participants within a specific tournament.

It contains both:

- Player identity information
- Tournament runtime statistics

Runtime fields:

- wins
- losses
- net
- curP
- lastR
- paired

These fields should not be interpreted as permanent player career statistics.

Future versions may separate:

- player profile
- tournament participation
- tournament statistics