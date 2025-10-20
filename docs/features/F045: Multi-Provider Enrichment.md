# F045: Multi-Provider Enrichment Support

## 📋 Overview

**Feature ID:** F045
**Priority:** P3 - Post-MVP Enhancement
**Timeline:** TBD (After F044 completion)
**Dependencies:** F044 (Data Pipeline with Apollo integration)
**Status:** Future Enhancement

---

## 🎯 Goals

Extend the enrichment capabilities beyond Apollo.io to support multiple data providers:

1. Support Clearbit, ZoomInfo, RocketReach, and other enrichment providers
2. Unified provider abstraction layer for consistent data mapping
3. Provider comparison and selection based on data quality/cost
4. Fallback enrichment (try multiple providers if first fails)
5. Cross-provider rate limiting and credit tracking
6. Provider-specific field mappings and transformations

---

## 💡 Why This Was Deferred from F044

**Complexity Reduction:**
- F044 focuses on core job queue + single provider (Apollo.io)
- Multi-provider support adds significant complexity:
  - Different API schemas for each provider
  - Complex data mapping and normalization
  - Multiple API key management
  - Provider-specific error handling
  - Cross-provider deduplication

**MVP Validation:**
- Need to validate BYOK model with one provider first
- Apollo.io provides 95% of enrichment needs
- Can assess demand for other providers post-launch

**Implementation Effort:**
- Single provider: ~2 weeks
- Multi-provider: ~4-6 weeks
- Better to launch faster and iterate

---

## 👥 User Stories

### Provider Management

1. **As a user**, I want to add API keys for multiple enrichment providers so I can choose the best data source
2. **As a user**, I want to compare enrichment results from different providers so I can pick the most accurate one
3. **As a user**, I want automatic fallback to a secondary provider if the primary fails so enrichment always succeeds

### Data Quality

1. **As an SDR**, I want enrichment to try multiple providers automatically so I get the most complete data
2. **As a user**, I want to see which provider each piece of data came from so I can trust the source
3. **As a user**, I want to merge data from multiple providers so I have the most comprehensive profile

### Cost Management

1. **As a user**, I want to set provider priority based on cost so I use cheaper providers first
2. **As a user**, I want to track API usage per provider so I can optimize spending
3. **As a user**, I want to set monthly limits per provider so I don't overspend

---

## ✅ Success Criteria

### Multi-Provider Support

- [ ] Support for at least 3 enrichment providers (Apollo, Clearbit, ZoomInfo)
- [ ] Unified API abstraction layer
- [ ] Provider-agnostic enrichment job interface
- [ ] Cross-provider data normalization

### Provider Management

- [ ] UI to manage multiple API keys
- [ ] Provider priority/fallback configuration
- [ ] Per-provider rate limiting
- [ ] Usage tracking per provider

### Data Quality

- [ ] Data merging from multiple sources
- [ ] Conflict resolution (different values from different providers)
- [ ] Source attribution (know which provider provided which field)
- [ ] Confidence scoring

---

## 🏗️ Technical Architecture

### Provider Abstraction Layer

```typescript
// Generic provider interface
interface EnrichmentProvider {
  name: string
  enrichAccount(domain: string): Promise<AccountEnrichmentResult>
  enrichContact(params: ContactSearchParams): Promise<ContactEnrichmentResult>
  verifyEmail(email: string): Promise<EmailVerificationResult>
  checkRateLimit(workspaceId: string): Promise<boolean>
  getRemainingCredits(apiKey: string): Promise<number>
}

// Implement for each provider
class ApolloProvider implements EnrichmentProvider { }
class ClearbitProvider implements EnrichmentProvider { }
class ZoomInfoProvider implements EnrichmentProvider { }
```

### Database Schema Extensions

```sql
-- Extend workspace_settings for multiple providers
ALTER TABLE workspace_settings ADD COLUMN clearbit_api_key_encrypted TEXT;
ALTER TABLE workspace_settings ADD COLUMN zoominfo_api_key_encrypted TEXT;
ALTER TABLE workspace_settings ADD COLUMN rocketreach_api_key_encrypted TEXT;

-- Provider priority configuration
CREATE TABLE enrichment_provider_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  provider_name VARCHAR(50) NOT NULL, -- 'apollo', 'clearbit', 'zoominfo'
  enabled BOOLEAN DEFAULT true,
  priority INT DEFAULT 0, -- Lower = higher priority

  -- Fallback settings
  use_as_fallback BOOLEAN DEFAULT false,
  fallback_delay_seconds INT DEFAULT 5,

  -- Usage limits
  monthly_credit_limit INT,
  credits_used_this_month INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(workspace_id, provider_name)
);

-- Track enrichment source attribution
ALTER TABLE accounts ADD COLUMN enrichment_provider VARCHAR(50);
ALTER TABLE accounts ADD COLUMN enrichment_confidence FLOAT; -- 0-1 score

ALTER TABLE contacts ADD COLUMN enrichment_provider VARCHAR(50);
ALTER TABLE contacts ADD COLUMN enrichment_confidence FLOAT;

-- Cross-provider enrichment results (for comparison)
CREATE TABLE enrichment_comparison (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  entity_type VARCHAR(20), -- 'account' or 'contact'
  entity_id UUID,

  provider_name VARCHAR(50),
  result JSONB, -- Full provider response
  confidence_score FLOAT,

  created_at TIMESTAMP DEFAULT NOW()
);
```

### Enrichment Flow with Multiple Providers

```
1. User clicks "Enrich Account"
   ↓
2. Load provider config (priority order)
   ↓
3. Try Provider #1 (highest priority)
   ↓
   ├─ Success → Use data, done
   └─ Fail → Try Provider #2
      ↓
      ├─ Success → Use data, done
      └─ Fail → Try Provider #3
         ↓
         └─ All failed → Job fails

Alternative: Parallel Enrichment
1. Call all enabled providers in parallel
2. Compare results
3. Merge data using confidence scores
4. Present to user for review
```

---

## 🎨 UI/UX Enhancements

### Provider Settings Page

**Location:** `/workspace/settings/enrichment-providers`

**Provider Cards (one per provider):**
- Provider logo and name
- API key input (masked)
- "Test Connection" button
- Enable/Disable toggle
- Priority slider (1-10)
- "Use as fallback" checkbox
- Monthly credit limit input
- Usage stats (credits used this month)

**Provider Comparison Table:**
| Feature | Apollo | Clearbit | ZoomInfo |
|---------|--------|----------|----------|
| Employee count | ✓ | ✓ | ✓ |
| Revenue | ✓ | ✓ | ✓ |
| Technologies | ✓ | ✓ | ✗ |
| Contact emails | ✓ | ✗ | ✓ |
| Pricing | $$ | $$$ | $$$$ |

**Fallback Configuration:**
- "Enrichment Strategy" dropdown:
  - "Use highest priority provider only"
  - "Try all providers in order (fallback)"
  - "Query all providers and compare results"

---

### Enrichment Result Comparison

**When multiple providers enabled:**

**Modal: "Compare Enrichment Results"**

Shows side-by-side comparison:

| Field | Apollo | Clearbit | Recommended |
|-------|--------|----------|-------------|
| Employee Count | 250 | 245 | 250 (Apollo - higher confidence) |
| Revenue | $50M | $52M | $50M |
| Industry | Software | SaaS | Software |

User can:
- Select which value to use for each field
- Choose "Use all from Apollo"
- Choose "Merge best values"

---

## 📦 Supported Providers

### 1. Apollo.io
- **Strengths:** Comprehensive B2B data, contact emails, technographics
- **API Docs:** https://apolloio.github.io/apollo-api-docs/
- **Rate Limit:** 100 req/min
- **Pricing:** From $49/user/month

### 2. Clearbit
- **Strengths:** Firmographic data, company intelligence, high accuracy
- **API Docs:** https://clearbit.com/docs
- **Rate Limit:** 600 req/min
- **Pricing:** Custom enterprise pricing

### 3. ZoomInfo
- **Strengths:** Extensive contact database, direct dials, intent data
- **API Docs:** https://api-docs.zoominfo.com/
- **Rate Limit:** Varies by plan
- **Pricing:** Custom enterprise pricing (typically $15k+/year)

### 4. RocketReach (Optional)
- **Strengths:** Email finding, social profiles
- **API Docs:** https://rocketreach.co/api
- **Rate Limit:** 100 req/min
- **Pricing:** From $39/month

### 5. Hunter.io (Email verification only)
- **Strengths:** Email verification and finding
- **API Docs:** https://hunter.io/api
- **Rate Limit:** Varies by plan
- **Pricing:** From $49/month

---

## 🚀 Implementation Plan

### Phase 1: Provider Abstraction (Week 1)
- [ ] Design provider interface
- [ ] Implement Apollo provider adapter (refactor existing)
- [ ] Create provider factory pattern
- [ ] Add provider config table
- [ ] Build provider management API endpoints

### Phase 2: Add Clearbit (Week 2)
- [ ] Implement Clearbit provider adapter
- [ ] Add Clearbit API key to settings
- [ ] Test enrichment with both providers
- [ ] Implement fallback logic
- [ ] Add provider selection to enrichment jobs

### Phase 3: Data Merging & Comparison (Week 3)
- [ ] Build data normalization layer
- [ ] Implement confidence scoring
- [ ] Create comparison UI
- [ ] Add source attribution to records
- [ ] Build merge conflict resolution

### Phase 4: Additional Providers (Week 4)
- [ ] Implement ZoomInfo provider
- [ ] Implement RocketReach provider (optional)
- [ ] Add Hunter.io for email verification
- [ ] Test all providers
- [ ] Document provider differences

### Phase 5: Advanced Features (Week 5)
- [ ] Parallel enrichment (query all providers)
- [ ] Smart provider selection based on field availability
- [ ] Cost optimization (use cheaper provider when possible)
- [ ] Provider health monitoring
- [ ] Auto-disable failing providers

---

## 🎯 Definition of Done

- [ ] At least 3 providers integrated (Apollo, Clearbit, ZoomInfo)
- [ ] Provider abstraction layer working
- [ ] Multi-provider fallback tested
- [ ] Data merging and comparison UI complete
- [ ] Source attribution for all enriched fields
- [ ] Rate limiting per provider working
- [ ] Usage tracking per provider accurate
- [ ] Provider settings page complete
- [ ] Documentation for adding new providers
- [ ] User guide for choosing providers
- [ ] All providers tested with real API keys

---

## 🔮 Future Enhancements (Post-F045)

1. **AI-Powered Provider Selection**: Use ML to recommend best provider based on industry/company size
2. **Data Quality Scoring**: Rate data quality from each provider over time
3. **Automatic Provider Switching**: Switch providers if one consistently fails
4. **Enrichment Marketplace**: Allow users to discover and add new providers
5. **Custom Provider Integration**: Allow users to add their own data sources via webhook
6. **Bulk Provider Comparison**: Compare all providers on a sample of accounts
7. **Provider Cost Analytics**: Show ROI per provider

---

## 📚 Resources

- [Apollo.io API Docs](https://apolloio.github.io/apollo-api-docs/)
- [Clearbit API Docs](https://clearbit.com/docs)
- [ZoomInfo API Docs](https://api-docs.zoominfo.com/)
- [RocketReach API Docs](https://rocketreach.co/api)
- [Hunter.io API Docs](https://hunter.io/api)

---

## ✅ Sign-Off

**Product Manager:** ___ **Date:** __

**Engineering Lead:** ___ **Date:** __

**QA Engineer:** ___ **Date:** __

---

## 📝 Notes

**Why start with Apollo.io only (F044)?**
- Apollo provides the most comprehensive B2B data in one platform
- 95% of use cases covered by Apollo alone
- Simpler implementation allows faster MVP launch
- Can validate BYOK model before adding complexity
- Other providers can be added based on user demand

**When to implement F045?**
- After F044 is stable and in production
- After gathering user feedback on Apollo integration
- When users request specific providers (Clearbit, ZoomInfo)
- When budget allows for enterprise provider testing
- Estimated: 4-6 weeks after F044 completion
