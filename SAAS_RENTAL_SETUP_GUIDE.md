# Iconic Yatra - SaaS Platform Setup Guide

## How to Rent Your Platform to Other Travel Companies

---

## 1. OVERVIEW: FROM STANDALONE TO SAAS

### Current State
- Single-instance application for one company
- Direct database access
- Single admin dashboard

### Target State
- Multi-tenant platform (separate data per customer)
- Subscription-based access
- Customer-specific branding
- Tiered pricing

---

## 2. MULTI-TENANCY ARCHITECTURE

### 2.1 Tenant Identification Strategy

#### Option A: Domain-based (Recommended for Premium Tier)
```
customer1.travelapp.com
customer2.travelapp.com
```
- Identify tenant from domain
- Custom branding per domain
- White-label capability

#### Option B: Path-based (Recommended for General Use)
```
travelapp.com/tenant/customer1
travelapp.com/tenant/customer2
```
- Single domain, multiple tenants
- Easier to manage
- Better for shared hosting

#### Option C: API Key-based (For API Consumers)
```
Header: X-Tenant-ID: abc123
```
- Identify tenant from header
- Works with mobile apps
- Partner integrations

### 2.2 Recommended Approach: Hybrid

**Combine Option B + C**
- Subdomain/path for web UI
- API key for mobile/partner apps
- Single domain for admin panel

---

## 3. DATABASE ARCHITECTURE FOR MULTI-TENANCY

### 3.1 Current Structure (Single Database)
```
Database: iconic_yatra
Collections: users, packages, hotels, payments...
```

### 3.2 Recommended Multi-Tenant Structure: Database per Tenant

```
Database: iconic_yatra_main (shared)
  - Tenants (company info, subscription)
  - Pricing Plans
  - Billing
  - Analytics

Database: iconic_yatra_tenant_001 (customer A)
  - users
  - packages
  - hotels
  - payments
  - staff
  - leads

Database: iconic_yatra_tenant_002 (customer B)
  - users
  - packages
  - hotels
  - payments
  - staff
  - leads
```

**Advantages**:
- Complete data isolation
- Individual backups per tenant
- Easy to migrate/delete tenant
- Better performance per tenant

### 3.3 Alternative: Schema-based Tenancy (Shared Database)

Add `tenantId` field to all collections:
```javascript
{
  tenantId: "tenant_001",
  name: "Rajasthan Tour Package",
  ...
}
```

**Easier to implement**, but less isolation.

---

## 4. IMPLEMENTATION STEPS

### STEP 1: Tenant Management System

#### 1.1 Create Tenant Model
```javascript
// models/Tenant.model.js
const tenantSchema = new Schema({
  tenantId: { type: String, unique: true, required: true },
  companyName: String,
  email: String,
  domain: String,
  plan: { type: String, enum: ['starter', 'professional', 'enterprise'] },
  status: { type: String, enum: ['active', 'suspended', 'trial'] },
  trialEndDate: Date,
  subscriptionEndDate: Date,
  logo: String,
  primaryColor: String,
  secondaryColor: String,
  features: [String], // dynamic features per plan
  maxUsers: Number,
  maxPackages: Number,
  storageLimit: Number,
  apiCallsPerMonth: Number,
  createdAt: Date,
  updatedAt: Date
});
```

#### 1.2 Create Tenant Identification Middleware
```javascript
// src/middleware/tenantMiddleware.js
export const tenantMiddleware = async (req, res, next) => {
  try {
    // Extract tenant from domain/path/header
    let tenantId;
    
    // Method 1: From subdomain
    const subdomain = req.subdomains[0];
    
    // Method 2: From URL path
    const pathMatch = req.path.match(/^\/tenant\/([^/]+)/);
    
    // Method 3: From header
    const headerTenant = req.headers['x-tenant-id'];
    
    tenantId = subdomain || pathMatch?.[1] || headerTenant;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant not specified' });
    }
    
    // Fetch tenant from main database
    const tenant = await TenantModel.findOne({ tenantId });
    
    if (!tenant || tenant.status !== 'active') {
      return res.status(403).json({ message: 'Tenant not found or inactive' });
    }
    
    // Attach to request
    req.tenant = tenant;
    req.tenantId = tenantId;
    req.tenantDb = getTenantDatabase(tenantId); // MongoDB connection
    
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

#### 1.3 Update app.js to Use Tenant Middleware
```javascript
// app.js
import { tenantMiddleware } from './src/middleware/tenantMiddleware.js';

// Apply tenant middleware to all protected routes
app.use('/api/v1', tenantMiddleware);
app.use('/api/v1/user', authRoutes); // No tenant needed for auth
app.use('/api/v1/staff', tenantMiddleware, verifyToken, staffRouter);
app.use('/api/v1/packages', tenantMiddleware, packageRoutes);
// ... all other routes
```

---

### STEP 2: Multi-Database Connection Management

#### 2.1 Update Database Connection
```javascript
// src/DB/index.js
import mongoose from 'mongoose';

const mainDbConnection = mongoose.createConnection(process.env.MONGO_MAIN_URI);

const tenantConnections = new Map();

export const getTenantDatabase = (tenantId) => {
  if (tenantConnections.has(tenantId)) {
    return tenantConnections.get(tenantId);
  }
  
  // Create new connection for tenant
  const tenantUri = process.env.MONGO_TENANT_URI.replace(
    '{tenantId}',
    tenantId
  );
  
  const connection = mongoose.createConnection(tenantUri);
  tenantConnections.set(tenantId, connection);
  
  return connection;
};

export { mainDbConnection };
```

#### 2.2 Environment Variables
```env
# .env
MONGO_MAIN_URI=mongodb://localhost:27017/iconic_yatra_main
MONGO_TENANT_URI=mongodb://localhost:27017/iconic_yatra_tenant_{tenantId}

# Or use MongoDB Atlas with separate databases
MONGO_MAIN_URI=mongodb+srv://user:pass@cluster.mongodb.net/iconic_yatra_main
MONGO_TENANT_URI=mongodb+srv://user:pass@cluster.mongodb.net/iconic_yatra_tenant_{tenantId}
```

---

### STEP 3: Update All Models for Multi-Tenancy

#### 3.1 Modify Package Model
```javascript
// src/models/package.model.js
import mongoose from 'mongoose';

export const getPackageModel = (tenantDb) => {
  const packageSchema = new mongoose.Schema({
    tenantId: String, // for reference
    packageName: String,
    destination: String,
    days: Number,
    price: Number,
    status: String,
    // ... other fields
  });
  
  return tenantDb.model('Package', packageSchema);
};
```

#### 3.2 Update Controllers to Use Tenant DB
```javascript
// src/controllers/package.controller.js
export const getAllPackages = async (req, res) => {
  try {
    const PackageModel = getPackageModel(req.tenantDb);
    const packages = await PackageModel.find();
    
    res.status(200).json({
      success: true,
      data: packages
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

### STEP 4: Subscription & Billing System

#### 4.1 Create Pricing Plan Model
```javascript
// src/models/PricingPlan.model.js
const pricingPlanSchema = new Schema({
  name: { type: String, enum: ['starter', 'professional', 'enterprise'] },
  monthlyPrice: Number,
  annualPrice: Number,
  features: {
    maxUsers: Number,
    maxPackages: Number,
    storageGB: Number,
    apiCallsPerMonth: Number,
    customDomain: Boolean,
    whiteLabelBranding: Boolean,
    prioritySupport: Boolean,
    customIntegrations: Boolean
  },
  createdAt: Date
});
```

#### 4.2 Create Subscription Model
```javascript
// src/models/Subscription.model.js
const subscriptionSchema = new Schema({
  tenantId: String,
  planId: Schema.Types.ObjectId,
  billingCycle: { type: String, enum: ['monthly', 'annual'] },
  status: { type: String, enum: ['active', 'canceled', 'expired', 'trial'] },
  startDate: Date,
  endDate: Date,
  nextBillingDate: Date,
  amount: Number,
  paymentMethod: String,
  razorpaySubscriptionId: String,
  autoRenewal: Boolean,
  cancellationDate: Date,
  createdAt: Date
});
```

#### 4.3 Create Billing Module
```javascript
// src/controllers/billing.controller.js
export const createSubscription = async (req, res) => {
  try {
    const { planId, billingCycle, razorpayPaymentId } = req.body;
    
    // Fetch pricing plan
    const plan = await PricingPlan.findById(planId);
    const amount = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
    
    // Create subscription in Razorpay
    const razorpaySubscription = await razorpayInstance.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      customer_notify: 1,
      quantity: 1,
      total_count: billingCycle === 'annual' ? 12 : 1,
      addon_id: null
    });
    
    // Save subscription to main DB
    const subscription = new Subscription({
      tenantId: req.tenantId,
      planId,
      billingCycle,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
      amount,
      razorpaySubscriptionId: razorpaySubscription.id
    });
    
    await subscription.save();
    
    // Update tenant features
    await Tenant.findOneAndUpdate(
      { tenantId: req.tenantId },
      {
        plan: plan.name,
        subscriptionEndDate: subscription.endDate,
        features: plan.features
      }
    );
    
    res.status(201).json({
      success: true,
      message: 'Subscription created',
      subscription
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

### STEP 5: Onboarding Flow for New Tenants

#### 5.1 Create Registration Endpoint
```javascript
// src/routers/tenant.router.js
import express from 'express';
import { registerTenant } from '../controllers/tenant.controller.js';

const router = express.Router();

// Public endpoint - no tenant middleware needed
router.post('/register', registerTenant);

export default router;
```

#### 5.2 Tenant Registration Controller
```javascript
// src/controllers/tenant.controller.js
import { v4 as uuidv4 } from 'uuid';
import { Tenant } from '../models/Tenant.model.js';

export const registerTenant = async (req, res) => {
  try {
    const {
      companyName,
      email,
      password,
      plan,
      domain
    } = req.body;
    
    // Generate unique tenant ID
    const tenantId = 'tenant_' + uuidv4().substring(0, 8);
    
    // Check if domain already taken
    if (domain) {
      const existing = await Tenant.findOne({ domain });
      if (existing) {
        return res.status(400).json({ message: 'Domain already taken' });
      }
    }
    
    // Create tenant in main database
    const tenant = new Tenant({
      tenantId,
      companyName,
      email,
      domain,
      plan: plan || 'starter',
      status: 'trial',
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 day trial
      features: getPlanFeatures(plan || 'starter'),
      createdAt: new Date()
    });
    
    await tenant.save();
    
    // Create tenant database
    const tenantUri = process.env.MONGO_TENANT_URI.replace('{tenantId}', tenantId);
    const tenantConnection = mongoose.createConnection(tenantUri);
    
    // Create admin user in tenant database
    const UserModel = getModelForTenant(tenantConnection, 'User', userSchema);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const adminUser = new UserModel({
      email,
      password: hashedPassword,
      role: 'admin',
      tenantId
    });
    
    await adminUser.save();
    
    // Send welcome email
    await sendWelcomeEmail(email, tenantId, companyName);
    
    res.status(201).json({
      success: true,
      message: 'Tenant registration successful',
      tenantId,
      trialDays: 14,
      accessUrl: domain ? `https://${domain}` : `https://app.travelplatform.com/tenant/${tenantId}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

function getPlanFeatures(planName) {
  const plans = {
    starter: {
      maxUsers: 5,
      maxPackages: 50,
      storageGB: 10,
      apiCallsPerMonth: 10000,
      customDomain: false,
      whiteLabelBranding: false,
      prioritySupport: false
    },
    professional: {
      maxUsers: 20,
      maxPackages: 500,
      storageGB: 100,
      apiCallsPerMonth: 100000,
      customDomain: true,
      whiteLabelBranding: true,
      prioritySupport: false
    },
    enterprise: {
      maxUsers: -1, // unlimited
      maxPackages: -1,
      storageGB: -1,
      apiCallsPerMonth: -1,
      customDomain: true,
      whiteLabelBranding: true,
      prioritySupport: true
    }
  };
  return plans[planName] || plans.starter;
}
```

---

### STEP 6: Feature Limiting Based on Plan

#### 6.1 Create Feature Check Middleware
```javascript
// src/middleware/featureAccess.middleware.js
export const checkFeatureAccess = (feature) => {
  return (req, res, next) => {
    const tenant = req.tenant;
    
    if (!tenant.features[feature]) {
      return res.status(403).json({
        message: `This feature is not available in your plan`,
        suggestedPlan: getUpgradeSuggestion(tenant.plan, feature)
      });
    }
    
    next();
  };
};

function getUpgradeSuggestion(currentPlan, requestedFeature) {
  const suggestions = {
    customDomain: { upgrade: 'professional', cost: 999 },
    whiteLabelBranding: { upgrade: 'professional', cost: 999 },
    prioritySupport: { upgrade: 'enterprise', cost: 2999 }
  };
  return suggestions[requestedFeature];
}
```

#### 6.2 Limit API Calls (Rate Limiting)
```javascript
// src/middleware/apiLimiter.middleware.js
import rateLimit from 'express-rate-limit';

export const apiLimiter = (req, res, next) => {
  const tenant = req.tenant;
  const monthlyLimit = tenant.features.apiCallsPerMonth;
  
  // Check current month's usage
  const limiter = rateLimit({
    windowMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    max: monthlyLimit,
    keyGenerator: (req) => req.tenantId,
    message: 'API call limit exceeded for this month'
  });
  
  limiter(req, res, next);
};
```

---

### STEP 7: White-Label Branding

#### 7.1 Branding Configuration Controller
```javascript
// src/controllers/branding.controller.js
export const updateBranding = async (req, res) => {
  try {
    const {
      logo,
      primaryColor,
      secondaryColor,
      companyName,
      supportEmail,
      supportPhone
    } = req.body;
    
    // Check if custom branding is allowed
    if (!req.tenant.features.whiteLabelBranding) {
      return res.status(403).json({
        message: 'White-label branding not available in your plan'
      });
    }
    
    const updatedTenant = await Tenant.findOneAndUpdate(
      { tenantId: req.tenantId },
      {
        logo,
        primaryColor,
        secondaryColor,
        companyName,
        supportEmail,
        supportPhone
      },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Branding updated',
      data: updatedTenant
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

### STEP 8: Deployment & Scaling

#### 8.1 Docker Compose for Multi-Tenant Setup
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      MONGO_MAIN_URI: mongodb://mongo:27017/iconic_yatra_main
      MONGO_TENANT_URI: mongodb://mongo:27017/iconic_yatra_tenant_{tenantId}
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  mongo_data:
```

#### 8.2 Kubernetes Deployment (Optional)
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: iconic-yatra-saas
spec:
  replicas: 3
  selector:
    matchLabels:
      app: iconic-yatra
  template:
    metadata:
      labels:
        app: iconic-yatra
    spec:
      containers:
      - name: app
        image: iconic-yatra:latest
        ports:
        - containerPort: 3000
        env:
        - name: MONGO_MAIN_URI
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: main-uri
```

---

## 5. PRICING MODELS

### Model 1: Tiered Subscription (Recommended)
```
Starter: $299/month
- 5 users
- 50 packages
- 10GB storage
- Email support

Professional: $899/month
- 20 users
- 500 packages
- 100GB storage
- Custom domain
- White-label branding
- Priority support

Enterprise: $2,999+/month
- Unlimited users
- Unlimited packages
- Unlimited storage
- Dedicated account manager
- Custom integrations
- 24/7 support
```

### Model 2: Pay-as-You-Go
```
Base: $99/month
+ $0.50 per booking
+ $0.10 per API call (over 10,000)
+ $5 per additional user (after 5)
```

### Model 3: Hybrid
```
Base Starter: $299/month
+ Revenue share: 2-3% of bookings made
+ Premium support: Add-on
```

---

## 6. SETUP CHECKLIST

- [ ] Create Tenant Model & Database
- [ ] Implement Tenant Middleware
- [ ] Update All Controllers to Use req.tenantDb
- [ ] Create Subscription System
- [ ] Set up Pricing Plans
- [ ] Implement Onboarding Flow
- [ ] Add Feature Limiting Middleware
- [ ] Create White-Label Branding System
- [ ] Set up Billing/Invoicing
- [ ] Configure Payment Gateway (Razorpay)
- [ ] Create Admin Dashboard for Multi-Tenant Management
- [ ] Implement Usage Analytics & Monitoring
- [ ] Set up Automated Backups per Tenant
- [ ] Create Customer Support Portal
- [ ] Test Multi-Tenant Data Isolation
- [ ] Security Audit (Multi-Tenant Security)
- [ ] Deploy to Production
- [ ] Set up Monitoring & Alerting

---

## 7. SECURITY CONSIDERATIONS FOR MULTI-TENANCY

### 7.1 Data Isolation
- Verify tenant on every API call
- Use separate databases or strict filtering
- Never expose other tenant's data
- Audit access logs

### 7.2 Authentication
- Separate JWT keys per tenant (optional)
- Cross-tenant token validation
- Session isolation
- Logout all devices on plan downgrade

### 7.3 Database Access
- Validate tenantId on every query
- Use database-level encryption
- Regular backups per tenant
- GDPR/Data deletion compliance

### 7.4 API Security
- Rate limiting per tenant
- API key management
- Webhook signature verification
- SSL/TLS for all connections

---

## 8. MONITORING & MAINTENANCE

### 8.1 Key Metrics to Track
```javascript
- Tenants: Active, Trial, Canceled, MRR
- Usage: API calls, storage, users per tenant
- Performance: Response time, error rate per tenant
- Billing: Revenue, failed payments, refunds
```

### 8.2 Automated Tasks
- Trial expiration warnings (5 days before)
- Subscription renewal emails
- Usage limit warnings (80% reached)
- Automatic payment retry on failure
- Daily backup per tenant

### 8.3 Scaling Strategies
- Database sharding by tenantId
- CDN for static assets per tenant
- Load balancing by tenant
- Separate instances for large tenants
- Read replicas for analytics

---

## 9. IMPLEMENTATION TIMELINE

### Week 1-2: Foundation
- [ ] Design multi-tenant architecture
- [ ] Create tenant & subscription models
- [ ] Implement tenant middleware
- [ ] Update database connections

### Week 3-4: Features
- [ ] Update all controllers for multi-tenancy
- [ ] Implement registration/onboarding
- [ ] Add subscription system
- [ ] Create pricing plans

### Week 5-6: Monetization
- [ ] Set up Razorpay subscriptions
- [ ] Create billing module
- [ ] Implement feature limiting
- [ ] Add white-label branding

### Week 7-8: Testing & Deployment
- [ ] Security testing
- [ ] Multi-tenant isolation testing
- [ ] Load testing
- [ ] Production deployment
- [ ] Monitoring setup

---

## 10. ESTIMATED COSTS

### Development
- Multi-tenancy implementation: $15,000 - $25,000
- Billing system: $5,000 - $10,000
- Testing & QA: $5,000 - $10,000
- **Total**: $25,000 - $45,000

### Infrastructure (Monthly)
- MongoDB Atlas (multi-tenant databases): $500 - $2,000
- Redis (caching): $100 - $300
- CDN (static assets): $200 - $500
- Email service (SendGrid): $50 - $300
- Payment processing (Razorpay fees): 2% of revenue
- Monitoring (Datadog/New Relic): $200 - $500
- **Total**: $1,250 - $3,600/month

### First Year Total
- Development: $25,000 - $45,000
- Infrastructure: $15,000 - $43,200
- Marketing/Sales: $10,000 - $30,000
- **Total**: $50,000 - $118,200

---

## 11. GO-TO-MARKET STRATEGY

### Phase 1: Soft Launch (Week 1-4)
- Launch with 10 beta customers
- Gather feedback
- Refine features
- Test infrastructure

### Phase 2: Early Access (Week 5-8)
- Offer 50% discount for annual commitment
- Build case studies
- Get testimonials
- Improve documentation

### Phase 3: Full Launch (Week 9+)
- Standard pricing
- Marketing campaign
- Sales team engagement
- Partner integrations

---

## 12. CUSTOMER SUPPORT STRUCTURE

### Support Channels
- Email: support@travelplatform.com (24-48 hrs)
- Chat: In-app support (business hours)
- Phone: Available for Enterprise tier
- Knowledge Base: Self-service docs
- Community: Forum for peer support

### SLAs by Plan
- **Starter**: Email only, 48-72 hour response
- **Professional**: Email + Chat, 24-hour response
- **Enterprise**: 24/7 phone + dedicated manager, 1-hour response

---

## NEXT STEPS

1. **Review this guide** with your development team
2. **Prioritize features** you want in Phase 1
3. **Design database** schema for your specific needs
4. **Set pricing** based on market research
5. **Create project timeline** and assign tasks
6. **Begin implementation** starting with tenant infrastructure

---

## DOCUMENT INFO

- **Platform**: Iconic Yatra Travel Management
- **Document**: SaaS Setup Guide
- **Version**: 1.0
- **Date**: 2026-04-29
- **Status**: Ready for Implementation
