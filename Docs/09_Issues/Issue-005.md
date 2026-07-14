# Issue: Public Experience & Commercial Platform Layer

## Background

During the Legacy system review, we identified that the existing platform
contains not only tournament operation functions, but also public-facing
features designed for spectators, players, and commercial partners.

One example is the top banner display / advertisement area, which was
previously implemented in the Legacy system.

During the Modern architecture redesign, the primary focus has been on:

- Tournament operation workflow
- Match management
- Referee operation
- Player participation

The public experience layer has not yet been formally included in the
Modern architecture.

## Observation

TOP should be considered as a platform with multiple user-facing layers:

### 1. Tournament Operation Layer

Users:

- Organizer
- Tournament staff
- Referee
- Team leader
- Player

Functions:

- Event setup
- Scheduling
- Match execution
- Score synchronization
- Result management


### 2. Public Experience Layer

Users:

- Spectators
- Live audience
- Media viewers
- Sponsors
- Commercial partners

Potential functions:

- Live tournament display
- Match information display
- Player / team information
- Tournament announcements
- Sponsor banners
- Commercial exposure
- Event promotion content


## Architectural Impact

The public experience layer should not be treated as a simple advertisement
feature.

It may become an independent module connected to:

- Tournament data
- Match status
- Live scores
- Player profiles
- Event content management


## Decision

Not part of current MVP refactor.

Keep as a future architecture direction.

Future module candidate:

Public Experience & Commercial Layer


## Related

Legacy features:
- Top banner advertisement
- Public tournament information display

Future considerations:
- Sponsor management
- Audience engagement
- Media display
- Commercial services