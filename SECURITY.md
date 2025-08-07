# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of OnChainAgents seriously. If you've found a security vulnerability, please follow these steps:

### 1. Do NOT Create a Public Issue

Security vulnerabilities should **never** be reported via public GitHub issues as this could put users at risk.

### 2. Contact Us Privately

Send details to: **security@onchainagents.fun**

Or reach out via:
- Discord: DM any admin on our [Discord server](https://discord.gg/onchainagents)
- Twitter: DM [@onchainagents](https://twitter.com/onchainagents)

### 3. Include These Details

Help us understand and fix the issue quickly:

- **Type of vulnerability** (e.g., private key exposure, rug detection bypass, etc.)
- **Affected components** (which agent/module)
- **Steps to reproduce** (be specific)
- **Potential impact** (what could an attacker do?)
- **Suggested fix** (if you have one)

### 4. What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 3-5 days
- **Fix Timeline**: Depends on severity
  - Critical: 1-3 days
  - High: 1 week
  - Medium: 2 weeks
  - Low: Next release

### 5. Responsible Disclosure

We ask that you:
- Give us reasonable time to fix the issue before public disclosure
- Avoid exploiting the vulnerability beyond what's necessary to demonstrate it
- Don't access or modify other users' data

## Security Best Practices

When using OnChainAgents:

### API Keys
- **Never commit API keys** to version control
- Use environment variables for all sensitive data
- Rotate keys regularly
- Use separate keys for development and production

### Smart Contract Interactions
- Always verify contract addresses
- Use the RugDetector before interacting with new tokens
- Monitor transactions with the SecurityAuditor agent
- Set appropriate slippage and gas limits

### Data Handling
- OnChainAgents processes public blockchain data only
- No private keys are ever stored or transmitted
- All API communications use HTTPS
- Local caching is encrypted

## Security Features

OnChainAgents includes several security-focused agents:

- **RugDetector**: Identifies potential scams and honeypots
- **SecurityAuditor**: Vulnerability and exploit detection
- **RiskAnalyzer**: Portfolio risk assessment
- **ChainAnalyst**: On-chain forensics and tracking

## Vulnerability Severity Levels

### Critical
- Private key exposure
- Remote code execution
- Authentication bypass
- Data corruption

### High
- Rug detection bypass
- Incorrect risk scoring
- API key leakage
- Cross-site scripting (XSS)

### Medium
- Information disclosure
- Denial of service
- Cache poisoning

### Low
- Debug information exposure
- Non-sensitive information leaks

## Recognition

We appreciate security researchers who help keep OnChainAgents safe:

- Acknowledged in release notes
- Listed in our Security Hall of Fame
- Potential bug bounty (case-by-case basis)

## Learn More

- [Security Best Practices](docs/security-best-practices.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Contributing Guidelines](CONTRIBUTING.md)

---

**Remember**: Security is everyone's responsibility. If something seems wrong, it probably is. Report it!