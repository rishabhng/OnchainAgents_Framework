# contributing to onchainagents.fun 🤝

yo, you wanna help build this thing? legend. let's go.

## 📋 quick nav

- [vibe check](#vibe-check)
- [how to contribute](#how-to-contribute)
- [dev setup](#dev-setup)
- [the workflow](#the-workflow)
- [code style](#code-style)
- [commit messages](#commit-messages)
- [pull requests](#pull-requests)
- [building agents](#building-agents)
- [testing](#testing)
- [getting help](#getting-help)

## 📜 vibe check

be cool. don't be a dick. we're all here to make crypto less scammy and more fun.

full [Code of Conduct](CODE_OF_CONDUCT.md) if you need the formal version.

## 🤔 how to contribute

### 🐛 found a bug?

before you report:
- check if someone already reported it (probably)
- actually try to reproduce it (not just "it's broken")

when reporting:
- use the bug template (we made it for a reason)
- include logs (all of them)
- tell us your environment (yes, even if you think it doesn't matter)
- bonus points for including a fix

### 💡 got an idea?

we want all the ideas:
- new agents? hell yes
- better algorithms? ship it
- ui improvements? please god yes
- memes? always

just open an issue and tell us:
- what problem it solves
- why it's awesome
- how it might work
- mockups if you got 'em

### 🤖 wanna add an agent?

new agent ideas are fire. tell us:
- what it does (in plain english)
- what data it needs
- why traders would care
- example use cases

### 📝 documentation fixes

even fixing typos helps. seriously. our spelling is atrocious.

## 🛠️ dev setup

```bash
# 1. fork it (you know how github works)
git clone https://github.com/YOUR_USERNAME/onchainagents.fun
cd onchainagents.fun

# 2. install stuff
npm install

# 3. setup env
cp .env.example .env
# add your hive api key (get one at hiveintelligence.xyz)

# 4. make sure it works
npm test

# 5. start hacking
npm run dev
```

## 🔄 the workflow

```bash
# 1. branch off
git checkout -b feature/something-cool

# 2. do your thing
# write code, break stuff, fix stuff

# 3. test it (please)
npm run lint
npm run typecheck
npm test

# 4. commit with a decent message
git commit -m "feat: add moon prediction agent"

# 5. push it
git push origin feature/something-cool

# 6. open PR and wait for glory
```

## 📏 code style

### typescript or gtfo

```typescript
// good - we know what this is
interface TokenAnalysis {
  score: number;
  risks: Risk[];
  recommendations: string[];
}

// bad - what is this, 2015?
const analysis: any = {};
```

### keep it simple

```typescript
// good - readable by humans
const calculateRiskScore = (risks: Risk[]): number => {
  return risks.reduce((score, risk) => 
    score - getRiskPenalty(risk.severity), 100
  );
};

// bad - are you trying to impress someone?
const calc = (r: any[]) => {
  let s = 100;
  for (let i = 0; i < r.length; i++) {
    s = s - pen(r[i].sev);
  }
  return s;
};
```

### handle errors like an adult

```typescript
// good
try {
  const result = await analyzeToken(address);
  return result;
} catch (error) {
  logger.error('token analysis failed', { error, address });
  throw new TokenAnalysisError('analysis failed', { cause: error });
}

// bad
try {
  return await analyzeToken(address);
} catch (e) {
  console.log('oops');
}
```

## 📝 commit messages

we use conventional commits but like, the chill version:

- `feat:` new stuff
- `fix:` fixed broken stuff
- `docs:` words about stuff
- `test:` testing stuff
- `refactor:` moved stuff around
- `perf:` made stuff faster
- `chore:` boring stuff

examples:
```bash
feat: add whale mating call detector
fix: stop rug detector from rugging itself
docs: explain what APY actually means
test: add tests that actually test things
perf: make alpha hunter 420% faster
```

## 🔀 pull requests

### before you PR:

- tests pass (non-negotiable)
- lint is happy
- you actually tested it
- docs are updated (if needed)

### PR checklist:

- [ ] descriptive title (not "fixes stuff")
- [ ] linked the issue (if there is one)
- [ ] explained what changed
- [ ] included screenshots (if UI)
- [ ] didn't break everything

### what happens next:

1. someone reviews it (probably)
2. they might ask for changes (definitely)
3. you fix their nitpicks (grudgingly)
4. we merge it (eventually)
5. you become a legend (immediately)

## 🤖 building new agents

wanna add an agent? here's how:

### 1. extend BaseAgent

```typescript
export class MoonPredictorAgent extends BaseAgent {
  // your genius code here
}
```

### 2. implement the required methods

```typescript
validateInput(context: AgentContext): z.ZodSchema {
  // what inputs do you need?
}

async performAnalysis(context: AgentContext): Promise<MoonPrediction> {
  // do the magic
}
```

### 3. add tests (yes, really)

```typescript
describe('MoonPredictorAgent', () => {
  it('should predict moons accurately', async () => {
    // test your magic
  });
  
  it('should not predict rugs as moons', async () => {
    // edge cases matter
  });
});
```

### 4. register it

add to the agent registry so people can actually use it

### 5. document it

tell people how to use your masterpiece

## 🧪 testing

### we're serious about tests

```bash
# run all tests
npm test

# run with coverage (must be >80%)
npm run test:coverage

# run specific test
npm test -- MoonPredictor

# watch mode (for the productive procrastinators)
npm run test:watch
```

### write good tests

```typescript
// good test - actually tests something
it('should detect honeypot functions', async () => {
  const result = await rugDetector.analyze({
    network: 'ethereum',
    address: KNOWN_HONEYPOT_ADDRESS,
  });
  
  expect(result.verdict).toBe('CRITICAL');
  expect(result.risks).toContainEqual(
    expect.objectContaining({ type: 'HONEYPOT' })
  );
});

// bad test - wtf does this even test?
it('should work', () => {
  expect(true).toBe(true);
});
```

## 🌍 community

### where to hang

- 💬 [discord](https://discord.gg/onchainagents) - main hangout spot
- 🐦 [twitter](https://twitter.com/onchainagents) - memes and updates
- 📧 [email](mailto:contribute@onchainagents.fun) - for the boomers

### getting help

stuck? ask for help:
- discord #dev-help channel
- open a discussion on github
- tweet at us (we're always online)

### recognition

we appreciate you:
- contributors get listed (immortality achieved)
- top contributors get special discord roles (flex on the plebs)
- exceptional contributors get mentioned in releases (fame!)
- legendary contributors become maintainers (power!)

## 🎉 that's it

seriously, that's all. now go build something cool.

remember: we're trying to make crypto better, one agent at a time. every contribution matters, even if it's just fixing a typo or adding a meme.

wagmi 🚀

---

**questions?** hit us up on [discord](https://discord.gg/onchainagents) or just yolo a PR and see what happens