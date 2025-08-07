#!/bin/bash

# OnChainAgents Claude Setup Script
# This script helps configure Claude Code or Claude Desktop to use OnChainAgents MCP server

echo "================================================"
echo "   OnChainAgents MCP Setup for Claude          "
echo "================================================"
echo ""

# Detect which Claude product to configure
echo "Which Claude product are you using?"
echo "1) Claude Code (CLI)"
echo "2) Claude Desktop (GUI)"
echo ""
read -p "Enter your choice (1 or 2): " CLAUDE_CHOICE

# Set config file based on choice
CLAUDE_CONFIG_DIR="$HOME/.config/claude"
if [ "$CLAUDE_CHOICE" = "1" ]; then
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_code_config.json"
    CLAUDE_PRODUCT="Claude Code"
elif [ "$CLAUDE_CHOICE" = "2" ]; then
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
    CLAUDE_PRODUCT="Claude Desktop"
else
    echo "Invalid choice. Please run the script again and select 1 or 2."
    exit 1
fi

echo ""
echo "Configuring $CLAUDE_PRODUCT..."
echo ""

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

# Check if npm package is installed
if ! command -v oca &> /dev/null; then
    echo "⚠️  OnChainAgents is not installed globally."
    read -p "Would you like to install it now? (y/n): " INSTALL_CHOICE
    if [ "$INSTALL_CHOICE" = "y" ] || [ "$INSTALL_CHOICE" = "Y" ]; then
        echo "Installing OnChainAgents..."
        npm install -g @onchainagents/core
        echo "✅ Installation complete!"
    fi
fi

echo ""
echo "Next steps:"
if [ "$CLAUDE_CHOICE" = "1" ]; then
    echo "1. Restart Claude Code (if running)"
    echo "2. Test with: 'Use oca_analyze to check ethereum USDC'"
    echo "3. Try: 'Find alpha opportunities on BSC using oca_hunt'"
else
    echo "1. Restart Claude Desktop"
    echo "2. Test with: 'Use oca_analyze to check ethereum 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'"
    echo "3. Try: 'Check if this token is safe using oca_security'"
fi
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
echo ""
echo "📚 Documentation:"
echo "  • Quick Reference: .claude/README.md"
echo "  • Full Setup Guide: CLAUDE_CODE_SETUP.md"
echo "  • Example Prompts: .claude/prompts.md"
echo "  • Tool Documentation: .claude/tools.md"
echo ""
echo "For production use (with real-time data):"
echo "1. Get API key from Hive Intelligence: https://t.me/hiveintelligence"
echo "2. Set HIVE_FALLBACK_MODE=false and add HIVE_API_KEY in the config"
echo ""
echo "Need help? Join our Discord: https://discord.gg/onchainagents"
echo ""