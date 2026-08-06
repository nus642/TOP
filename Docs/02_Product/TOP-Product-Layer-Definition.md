# TOP Product Layer Definition

Version: 1.1

Status: Active

Last Updated: 2026-08-06

Author:
TOP Product Team

---

# Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2026-08-06 | Added translation principles, readiness relationship, and ownership guardrails |
| 1.0 | 2026-08-06 | Initial Product Layer definition |

---

# Purpose

TOP requires a Product Layer to bridge stable business intent and future engineering design. Business Architecture describes what the business is and must be able to do, but it does not by itself describe the goals users pursue or the workflows through which they achieve them.

The Product Layer translates business capabilities into user-oriented outcomes. It expresses business intent as goals, stories, workflows, and bounded product scope that can guide later design without prescribing an implementation.

# Position

```text
Business Architecture
        ↓
Product Layer
        ↓
Engineering Design
```

The Product Layer is downstream of Business Architecture and upstream of Engineering Design. It preserves the business boundaries established by Architecture while providing Engineering with an outcome-oriented description of what the product must enable.

# Inputs

The Product Layer receives the following authoritative inputs from Business Architecture:

- Mission and business direction
- Business Domains
- Business Capabilities
- Business Objects
- Operational Capabilities

These inputs are interpreted for product use; they are not redefined or reassigned by the Product Layer.

# Product Layer Translation Principles

- **Business Domains constrain product definition.** Product goals, stories, workflows, and scope must remain within established domain responsibilities and boundaries. Cross-domain product needs may coordinate outcomes but do not merge or relocate domain responsibility.
- **Business Capabilities become product outcomes.** The Product Layer expresses the user value and observable result enabled by an established capability; it does not redefine the capability or its owner.
- **Business Objects support stories and workflows.** Stories and workflows use the established meaning and relationships of Business Objects to describe the business information users encounter, create, or act upon. Their use does not change object or record ownership.
- **Operational Capabilities derive operational workflows.** The role, operational outcome, handoff, and boundary described by an Operational Capability provide the basis for a user-oriented workflow. The workflow makes that operation understandable without altering the underlying responsibility.
- **Product Scope does not change ownership.** Including an outcome, story, workflow, or Business Object in Product Scope identifies what the product must enable; it does not assign or transfer domain, capability, object, or record ownership.

# Outputs

The Product Layer produces:

- **User Goals** — outcomes that a user needs to achieve in support of the business mission.
- **User Stories** — concise statements of user need and intended value.
- **Operational Workflows** — user-visible sequences and interactions for achieving a goal across relevant business boundaries.
- **Product Scope** — a clear statement of included and excluded product outcomes for a product initiative or increment.

Together, these outputs form the product intent consumed by Engineering Design.

# Responsibilities

The Product Layer is responsible for:

- Identifying relevant users and the goals they must achieve.
- Translating established business capabilities into user needs and outcomes.
- Describing user stories and their intended value.
- Defining operational workflows from the user's perspective.
- Establishing product scope and outcome-based boundaries.
- Maintaining traceability from product outputs to their Business Architecture inputs.
- Providing clear, implementation-neutral intent for Engineering Design.
- Validating that proposed product behavior supports the mission and respects established business boundaries.

# Non-responsibilities

The Product Layer does not define or own:

- Mission
- Business Domain definition
- Capability ownership
- Business Object ownership
- Record ownership
- Technical architecture
- Database design
- API design
- Service or module design
- UI implementation
- Deployment design

Questions in these areas must be resolved by the appropriate Architecture or Engineering authority rather than embedded in Product Layer outputs.

# Relationship with Other Layers

| Layer | Primary concern | Boundary |
|-------|-----------------|----------|
| Business Architecture | Defines business structure, meaning, responsibilities, and boundaries. | Establishes the authoritative business context; it does not prescribe user interaction or implementation. |
| Product Layer | Defines how users achieve goals within the established business context. | Specifies outcomes, stories, workflows, and scope; it does not alter business ownership or select technical solutions. |
| Engineering Design | Defines how the system supports the product goals and workflows. | Selects technical structures and implementation approaches while preserving product intent and business boundaries. |

The handoff is therefore directional: Architecture defines the business frame, Product defines the user-oriented intent within that frame, and Engineering designs the system support for that intent. Feedback may expose a need for clarification, but a downstream layer does not silently redefine an upstream decision.

## Relationship with the TOP Engineering Readiness Plan

The Product Layer and the TOP Engineering Readiness Plan are complementary views, not competing layers:

- The **Product Layer** defines the user goals, user stories, operational workflows, and Product Scope that state what users must be able to achieve.
- The **TOP Engineering Readiness Plan** defines the validation and readiness path toward implementation, making the evidence needed for operational confidence visible.

Product outputs therefore inform readiness planning, while readiness findings may identify product intent that needs clarification. Engineering Readiness does not replace Product definition, and Product definition does not establish readiness gates or validation evidence.
