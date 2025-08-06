# SentimentAnalyzer Agent

## Overview
The SentimentAnalyzer agent monitors and analyzes social sentiment across multiple platforms to gauge market psychology and identify sentiment-driven opportunities. It processes millions of social media posts, news articles, and on-chain social signals to provide real-time sentiment insights.

## Capabilities

### Multi-Platform Analysis
- **Twitter/X**: Real-time tweet analysis, influencer tracking
- **Reddit**: Subreddit sentiment, trending discussions
- **Telegram**: Group chat analysis, announcement monitoring
- **Discord**: Community sentiment, developer activity
- **News Sources**: Mainstream media, crypto publications

### Sentiment Metrics
- **Overall Sentiment**: Bullish, bearish, or neutral classification
- **Sentiment Velocity**: Rate of sentiment change
- **Social Volume**: Mention frequency and reach
- **Engagement Rate**: Likes, shares, comments analysis
- **Influencer Impact**: Weighted sentiment by influence

### Advanced Analytics
- **Emotion Detection**: Fear, greed, euphoria, capitulation
- **Narrative Tracking**: Emerging themes and stories
- **FUD Detection**: Coordinated fear campaigns
- **Shill Detection**: Artificial promotion identification
- **Trend Prediction**: Sentiment-based price forecasting

## Usage

### Basic Sentiment Check
```typescript
const sentiment = await oca.sentiment('BTC');

// Returns overall sentiment score and breakdown
```

### Multi-Source Analysis
```typescript
const detailed = await oca.sentiment('ETH', {
  sources: 'twitter,reddit,telegram',
  timeframe: '24h',
  includeInfluencers: true,
  minFollowers: 10000
});
```

### Narrative Tracking
```typescript
const narratives = await oca.sentiment('market', {
  type: 'narratives',
  trending: true,
  minMentions: 1000,
  timeframe: '7d'
});
```

## Sentiment Scoring

### Score Interpretation
| Score | Range | Market State | Typical Action |
|-------|-------|--------------|----------------|
| Extreme Greed | 80-100 | Euphoric, overbought | Consider selling |
| Greed | 60-79 | Bullish, optimistic | Hold or trim |
| Neutral | 40-59 | Balanced, uncertain | Accumulate quality |
| Fear | 20-39 | Bearish, pessimistic | Buy opportunity |
| Extreme Fear | 0-19 | Capitulation, oversold | Strong buy signal |

### Sentiment Components
- **Social Volume** (25%): Mention frequency across platforms
- **Engagement Rate** (20%): Interaction levels with content
- **Influencer Sentiment** (20%): Weighted by follower count
- **News Sentiment** (15%): Media coverage tone
- **Price Correlation** (10%): Sentiment-price relationship
- **Emotion Intensity** (10%): Strength of expressed emotions

## Platform-Specific Insights

### Twitter/X Analysis
```typescript
interface TwitterSentiment {
  overallSentiment: number;        // 0-100
  tweetsAnalyzed: number;
  
  topInfluencers: Array<{
    handle: string;
    followers: number;
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    recentTweets: Array<{
      text: string;
      engagement: number;
      sentiment: number;
    }>;
  }>;
  
  trendingTopics: string[];
  hashtagSentiment: Record<string, number>;
  
  metrics: {
    tweetsPerHour: number;
    uniqueAuthors: number;
    averageEngagement: number;
    viralTweets: number;
  };
}
```

### Reddit Analysis
```typescript
interface RedditSentiment {
  overallSentiment: number;
  
  subredditBreakdown: Array<{
    subreddit: string;
    subscribers: number;
    sentiment: number;
    activity: 'HIGH' | 'MEDIUM' | 'LOW';
    
    topPosts: Array<{
      title: string;
      score: number;
      comments: number;
      sentiment: number;
    }>;
  }>;
  
  discussionThemes: string[];
  communityMood: string;
}
```

### Telegram/Discord Analysis
```typescript
interface ChatSentiment {
  overallSentiment: number;
  
  groupAnalysis: Array<{
    name: string;
    members: number;
    messagesPerHour: number;
    sentiment: number;
    
    keyTopics: string[];
    activeUsers: number;
    moderatorSentiment: number;
  }>;
  
  announcementImpact: Array<{
    message: string;
    sentimentShift: number;
    engagement: number;
  }>;
}
```

## API Response Format

```typescript
interface SentimentAnalyzerResult {
  success: boolean;
  data: {
    token: string;
    
    overall: {
      score: number;                // 0-100
      classification: 'EXTREME_GREED' | 'GREED' | 'NEUTRAL' | 'FEAR' | 'EXTREME_FEAR';
      trend: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
      velocity: number;             // Rate of change
    };
    
    breakdown: {
      twitter: number;
      reddit: number;
      telegram: number;
      discord: number;
      news: number;
    };
    
    emotions: {
      fear: number;
      greed: number;
      joy: number;
      anger: number;
      surprise: number;
    };
    
    metrics: {
      totalMentions: number;
      uniqueAuthors: number;
      reach: number;                // Estimated audience
      engagement: number;            // Total interactions
      viralContent: number;          // Highly shared items
    };
    
    influencers: Array<{
      platform: string;
      handle: string;
      followers: number;
      sentiment: number;
      impact: 'HIGH' | 'MEDIUM' | 'LOW';
    }>;
    
    narratives: Array<{
      theme: string;
      sentiment: number;
      momentum: 'GROWING' | 'STABLE' | 'FADING';
      mentions: number;
    }>;
    
    alerts: Array<{
      type: 'FUD' | 'SHILL' | 'COORDINATION' | 'INFLUENCER' | 'NARRATIVE_SHIFT';
      description: string;
      severity: 'HIGH' | 'MEDIUM' | 'LOW';
      evidence: string[];
    }>;
    
    prediction: {
      nextHour: number;             // Predicted sentiment
      next24h: number;
      confidence: number;           // 0-1
    };
  };
  timestamp: string;
}
```

## Sentiment Strategies

### Contrarian Trading
```typescript
// Buy extreme fear, sell extreme greed
const contrarian = await oca.sentiment('TOKEN', {
  alerts: {
    extremeFear: { threshold: 20, action: 'BUY_SIGNAL' },
    extremeGreed: { threshold: 80, action: 'SELL_SIGNAL' }
  }
});
```

### Momentum Following
```typescript
// Follow improving sentiment
const momentum = await oca.sentiment('TOKEN', {
  trend: 'improving',
  velocity: 'positive',
  minDuration: '3d'          // Sustained improvement
});
```

### Event Trading
```typescript
// Monitor announcement impact
const eventImpact = await oca.sentiment('TOKEN', {
  event: 'announcement',
  baseline: '1h_before',     // Compare to pre-event
  measure: 'shift'           // Sentiment change
});
```

## Integration with Other Agents

### Sentiment + Technical Analysis
- Combine with MarketStructureAnalyst for confluence
- Extreme sentiment often marks reversals
- Divergences between price and sentiment

### Sentiment + Whale Activity
- Compare WhaleTracker data with public sentiment
- Smart money often moves opposite to crowd
- Identify manipulation or genuine interest

### Sentiment + Alpha Hunting
- Use AlphaHunter to find tokens with improving sentiment
- Early sentiment shifts predict price movements
- Narrative alignment for maximum gains

## Advanced Features

### FUD Detection System
```typescript
const fudAnalysis = await oca.sentiment('TOKEN', {
  detectFUD: true,
  indicators: [
    'suddenNegativeSpike',      // Rapid sentiment drop
    'coordinatedAccounts',      // Similar messages
    'unusualTiming',           // Off-hours activity
    'lowQualityAccounts'       // Bot/new accounts
  ]
});
```

### Influencer Monitoring
```typescript
const influencerWatch = await oca.sentiment('influencers', {
  watchlist: ['@elonmusk', '@VitalikButerin'],
  tokens: ['DOGE', 'ETH'],
  alertOnMention: true,
  impactAnalysis: true
});
```

### Narrative Evolution
```typescript
const narrativeTracking = await oca.sentiment('narratives', {
  track: ['AI', 'RWA', 'Gaming'],
  evolution: true,             // Track over time
  leaders: true,               // Identify narrative leaders
  rotation: true               // Detect narrative shifts
});
```

## Best Practices

### Daily Sentiment Monitoring
1. Check overall market sentiment
2. Review your portfolio sentiment
3. Identify sentiment divergences
4. Track narrative evolution
5. Monitor influencer activity

### Sentiment Trading Rules
- Don't trade solely on sentiment
- Extreme readings are often reversal points
- Sustained sentiment trends are powerful
- Combine with technical and fundamental analysis
- Be aware of manipulation

### Red Flags
- 🚫 Sudden coordinated sentiment shifts
- 🚫 Bot-driven social activity
- 🚫 Paid promotion campaigns
- 🚫 Single-source sentiment spikes
- 🚫 Sentiment-price divergence

## Performance Metrics

### Accuracy Statistics
- **Sentiment Classification**: 85% accuracy
- **Trend Prediction**: 72% accuracy (1h)
- **FUD Detection**: 78% precision
- **Bot Detection**: 91% accuracy
- **Influencer Impact**: 68% correlation

### Predictive Power
- **1-hour Prediction**: 72% accuracy
- **24-hour Prediction**: 61% accuracy
- **Reversal Detection**: 74% success rate
- **Narrative Identification**: 83% accuracy

## Limitations

- Cannot detect private group sentiment
- Language barriers for non-English content
- Sarcasm and irony detection challenges
- Bot manipulation possible
- Lag in processing breaking news

## Sentiment Indicators

### Bullish Indicators
- ✅ Sustained positive sentiment >3 days
- ✅ Increasing social volume with positive tone
- ✅ Influencer endorsements
- ✅ Positive narrative alignment
- ✅ Fear to greed transition

### Bearish Indicators
- 🔴 Sustained negative sentiment >3 days
- 🔴 FUD campaign detection
- 🔴 Influencer criticism
- 🔴 Narrative breakdown
- 🔴 Greed to fear transition

## Updates and Improvements

The SentimentAnalyzer agent is continuously enhanced with:
- Natural language processing improvements
- Expanded platform coverage
- Better bot detection algorithms
- Multi-language support
- Real-time alert systems