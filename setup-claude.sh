#!/bin/bash

# OnChainAgents Claude Desktop Setup Script
# This script helps configure Claude Desktop to use OnChainAgents MCP server

echo "================================================"
echo "   OnChainAgents MCP Setup for Claude Desktop  "
echo "================================================"
echo ""

# Check if Claude config directory exists
CLAUDE_CONFIG_DIR="$HOME/.config/claude"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

if [ ! -d "$CLAUDE_CONFIG_DIR" ]; then
    echo "Creating Claude config directory..."
    mkdir -p "$CLAUDE_CONFIG_DIR"
fi

# Check if config file exists
if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    echo "Found existing Claude configuration."
    echo "Backing up to $CLAUDE_CONFIG_FILE.backup"
    cp "$CLAUDE_CONFIG_FILE" "$CLAUDE_CONFIG_FILE.backup"
else
    echo "Creating new Claude configuration..."
    echo '{}' > "$CLAUDE_CONFIG_FILE"
fi

# Add OnChainAgents MCP server configuration
echo ""
echo "Adding OnChainAgents MCP server to Claude configuration..."

# Use jq if available, otherwise use Python
if command -v jq &> /dev/null; then
    # Using jq
    jq '.mcpServers.onchainagents = {
        "command": "npx",
        "args": ["@onchainagents/core", "oca-mcp"],
        "env": {
            "HIVE_FALLBACK_MODE": "true"
        }
    }' "$CLAUDE_CONFIG_FILE" > "$CLAUDE_CONFIG_FILE.tmp" && mv "$CLAUDE_CONFIG_FILE.tmp" "$CLAUDE_CONFIG_FILE"
elif command -v python3 &> /dev/null; then
    # Using Python
    python3 - <<EOF
import json
import os

config_file = "$CLAUDE_CONFIG_FILE"

# Read existing config
try:
    with open(config_file, 'r') as f:
        config = json.load(f)
except:
    config = {}

# Add OnChainAgents MCP server
if 'mcpServers' not in config:
    config['mcpServers'] = {}

config['mcpServers']['onchainagents'] = {
    "command": "npx",
    "args": ["@onchainagents/core", "oca-mcp"],
    "env": {
        "HIVE_FALLBACK_MODE": "true"
    }
}

# Write updated config
with open(config_file, 'w') as f:
    json.dump(config, f, indent=2)

print("Configuration updated successfully!")
EOF
else
    echo "Error: Neither jq nor python3 found. Please install one of them."
    echo ""
    echo "Manual configuration:"
    echo "Add the following to your Claude Desktop config at:"
    echo "$CLAUDE_CONFIG_FILE"
    echo ""
    cat claude-config.json
    exit 1
fi

echo ""
echo "✅ Configuration complete!"
echo ""
echo "Next steps:"
echo "1. Install OnChainAgents globally: npm install -g @onchainagents/core"
echo "2. Restart Claude Desktop"
echo "3. Test with: 'Use oca_analyze to check ethereum 0x...'"
echo ""
echo "Available tools in Claude:"
echo "  • oca_analyze - Comprehensive token analysis"
echo "  • oca_security - Security and rug detection"
echo "  • oca_hunt - Find alpha opportunities"
echo "  • oca_track - Track whale wallets"
echo "  • oca_sentiment - Social sentiment analysis"
echo "  • oca_research - Deep token research"
echo "  • oca_defi - DeFi protocol analysis"
echo "  • oca_bridge - Cross-chain routing"
echo "  • oca_portfolio - Portfolio analysis"
echo "  • oca_market - Market structure analysis"
echo ""
echo "For production use:"
echo "1. Contact Hive Intelligence: https://t.me/hiveintelligence"
echo "2. Set HIVE_FALLBACK_MODE=false in the config"
echo ""