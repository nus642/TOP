# DEV-002 Configuration Management

**Status:** Active

**Applies To:** TOP Modern

---

# Purpose

Define the standard configuration management approach for the TOP Modern project.

Goals:

- Separate configuration from source code
- Support multiple development environments
- Protect sensitive information
- Simplify deployment
- Improve maintainability

---

# Principles

Configuration should never be hardcoded whenever practical.

Use environment variables for values that may change between environments.

Examples:

- Database Host
- Database Port
- Database User
- Database Password
- Server Port

---

# Environment File

Project root:

```
Modern/
    .env
```

Example:

```text
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=123456
MYSQL_DATABASE=nhpa
```

The `.env` file is loaded using:

```javascript
require("dotenv").config();
```

---

# Accessing Configuration

Always access configuration through `process.env`.

Example:

```javascript
host: process.env.MYSQL_HOST || "localhost",
port: process.env.MYSQL_PORT || 3306,
user: process.env.MYSQL_USER || "root",
password: process.env.MYSQL_PASSWORD || "",
database: process.env.MYSQL_DATABASE || "nhpa"
```

Fallback values should be provided when appropriate.

---

# Default Values

Default values are intended only for local development.

They should:

- Keep the project runnable
- Reduce setup effort
- Not replace proper environment configuration

Production environments should always provide explicit environment variables.

---

# Sensitive Information

Do not hardcode:

- Passwords
- Tokens
- API Keys
- Secrets

These values belong in:

- `.env`
- Deployment environment variables
- Secret management systems (future)

---

# Multi-Computer Development

The project is developed on multiple computers.

Each computer maintains its own local `.env`.

Application code should not require modification when switching computers.

---

# Source Control

The `.env` file should not be committed to Git.

Instead, provide:

```
.env.example
```

Example:

```text
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=nhpa
```

Developers create their own `.env` based on this template.

---

# Current Scope

Current environment variables include:

- MYSQL_HOST
- MYSQL_PORT
- MYSQL_USER
- MYSQL_PASSWORD
- MYSQL_DATABASE

Additional configuration may be added as the project grows.

---

# Future Considerations

Future versions may introduce:

- Development / Test / Production environments
- Docker Compose configuration
- Cloud deployment
- CI/CD environment variables
- Secret management

These enhancements should remain compatible with the current configuration approach.

---

# Guiding Principle

> Build for Today.
>
> Design for Tomorrow.