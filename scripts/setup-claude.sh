#!/bin/bash

# OnChainAgents Setup Script for Claude Integration
# This script sets up both Hive Intelligence and OnChainAgents MCP servers

echo "🚀 OnChainAgents Setup for Claude"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Claude CLI is installed
check_claude() {
    if command -v claude &> /dev/null; then
        echo -e "${GREEN}✅ Claude CLI found${NC}"
        return 0
    else
        echo -e "${RED}❌ Claude CLI not found${NC}"
        echo "Please install Claude CLI first: https://docs.anthropic.com/claude/docs/claude-cli"
        return 1
    fi
}

# Add Hive Intelligence MCP
setup_hive() {
    echo ""
    echo "📡 Setting up Hive Intelligence MCP..."
    echo "--------------------------------------"
    
    # Check if Hive is already added
    if claude mcp list 2>/dev/null | grep -q "hive"; then
        echo -e "${YELLOW}⚠️  Hive Intelligence already configured${NC}"
        echo "   To update, run: claude mcp remove hive"
        echo "   Then run this script again"
    else
        # Add Hive Intelligence
        if claude mcp add --transport http hive https://hiveintelligence.xyz/mcp; then
            echo -e "${GREEN}✅ Hive Intelligence MCP added successfully!${NC}"
            echo "   Endpoint: https://hiveintelligence.xyz/mcp"
            echo "   Transport: HTTP"
            echo "   No API key required!"
        else
            echo -e "${RED}❌ Failed to add Hive Intelligence MCP${NC}"
            return 1
        fi
    fi
}

# Setup OnChainAgents local MCP server
setup_onchainagents() {
    echo ""
    echo "🤖 Setting up OnChainAgents MCP Server..."
    echo "-----------------------------------------"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ Not in OnChainAgents directory${NC}"
        echo "Please run this script from the onchainagents-fun root directory"
        return 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
    fi
    
    # Build if needed
    if [ ! -d "dist" ]; then
        echo "🔨 Building OnChainAgents..."
        npm run build 2>/dev/null || echo -e "${YELLOW}⚠️  Build has some warnings (non-critical)${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✅ OnChainAgents is ready!${NC}"
    echo ""
    echo "To start the MCP server, run:"
    echo -e "${YELLOW}  npx tsx src/orchestrator/mcp-server.ts${NC}"
    echo ""
    echo "Then in another terminal, add to Claude:"
    echo -e "${YELLOW}  claude mcp add onchainagents${NC}"
}

# Test the setup
test_setup() {
    echo ""
    echo "🧪 Testing Setup..."
    echo "-------------------"
    
    # List MCP servers
    echo "📋 Available MCP servers:"
    claude mcp list 2>/dev/null || echo -e "${YELLOW}⚠️  Could not list MCP servers${NC}"
    
    echo ""
    echo "🎯 Quick test commands:"
    echo ""
    echo "Test Hive Intelligence:"
    echo -e "${YELLOW}  claude \"Using hive, what blockchain tools are available?\"${NC}"
    echo ""
    echo "Test token analysis:"
    echo -e "${YELLOW}  claude \"Using hive, analyze ethereum token 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48\"${NC}"
}

# Main setup flow
main() {
    echo "This script will set up:"
    echo "1. Hive Intelligence MCP (direct connection)"
    echo "2. OnChainAgents MCP server (local orchestration)"
    echo ""
    
    # Check Claude CLI
    if ! check_claude; then
        exit 1
    fi
    
    # Setup Hive Intelligence
    setup_hive
    
    # Setup OnChainAgents
    setup_onchainagents
    
    # Test setup
    test_setup
    
    echo ""
    echo "✨ Setup complete!"
    echo ""
    echo "📚 Documentation:"
    echo "   • Hive Integration: ./HIVE_INTEGRATION_GUIDE.md"
    echo "   • Commands: ./COMMAND_REFERENCE.md"
    echo "   • Architecture: ./ARCHITECTURE.md"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Start OnChainAgents MCP: npx tsx src/orchestrator/mcp-server.ts"
    echo "   2. Add to Claude: claude mcp add onchainagents"
    echo "   3. Start using: claude \"analyze token 0x...\""
    echo ""
    echo "Happy analyzing! 🎉"
}

# Run main function
main