# Contextual Hints System - Implementation Guide

## 📚 Overview

The hints system provides **contextual guidance** throughout your app, teaching users best practices and answering questions before they ask. Hints are:

- **Context-aware**: Different hints on different pages
- **Smart**: Show only relevant hints based on user role and experience
- **Dismissible**: Users can hide hints they don't need
- **Trackable**: See which hints are helpful vs ignored
- **Priority-based**: Critical tax/legal info shows first

---

## 🎯 Quick Start

### 1. Deploy the Database

Run `supabase-hints-system.sql` in your Supabase SQL editor. This creates:
- `hints_library` - 30+ pre-written hints
- `user_hint_interactions` - Tracks what users have seen
- Smart functions for hint delivery

### 2. Add Hints to Any Page

```tsx
import HintsContainer from './components/HintsContainer';

function MyPage() {
    return (
        <div>
            <h1>My Page</h1>
            
            {/* Add hints below header */}
            <HintsContainer position="top" maxHints={2} />
            
            {/* Your page content */}
        </div>
    );
}
```

### 3. Choose Display Position

```tsx
// Top of page (default)
<HintsContainer position="top" maxHints={3} />

// Bottom of page
<HintsContainer position="bottom" maxHints={2} />

// Floating sidebar (bottom-right)
<HintsContainer position="sidebar" maxHints={1} />
```

---

## 💡 Pre-Loaded Hints (30+)

### Estimates Page
- ✅ "Pay yourself as an employee for easier tax accounting"
- ✅ "Detailed task breakdown increases client trust"
- ✅ "Include 10-15% contingency buffer"
- ✅ "AI-generated visualizations convert 3x better"

### Projects Page
- ✅ "Document everything with photos"
- ✅ "Get milestone approvals before marking complete"
- ✅ "Communicate proactively with daily updates"

### Team Management
- ✅ "Clear compensation agreements prevent disputes"
- ✅ "Track certifications and skills"
- ✅ "Build reputation together"

### Payments & Tax
- ✅ "Separate business & personal bank accounts" (CRITICAL)
- ✅ "Track deductible expenses"
- ✅ "Quarterly estimated taxes" (CRITICAL)
- ✅ "Voluntary donations are tax-deductible"

### Community
- ✅ "Build your badge tier (Bronze → Platinum)"
- ✅ "Network = Net Worth"
- ✅ "Share your expertise"

### Profile
- ✅ "Complete your profile for 5x more invitations"
- ✅ "Set availability status"

### Scheduling
- ✅ "Sync Google Calendar"
- ✅ "Buffer time between projects"

### Photography
- ✅ "Consistent photo quality = 300% better conversions"
- ✅ "Show the process, not just before/after"

### Milestones
- ✅ "Front-load early payments (30-50% upfront)"
- ✅ "Milestone = Deliverable (clear & measurable)"

### General
- ✅ "Keyboard shortcuts (Ctrl+K to search)"
- ✅ "Mobile app works great - add to home screen"

---

## 🎨 Hint Priority Levels

### **CRITICAL** (Red) 🚨
- Tax compliance issues
- Legal requirements
- Financial red flags
- **Example**: "Separate business & personal accounts!"

### **HIGH** (Orange) ⚠️
- Money-saving tips
- Efficiency boosters
- Revenue opportunities
- **Example**: "Pay yourself as an employee"

### **MEDIUM** (Blue) ℹ️
- Best practices
- Quality improvements
- Time savers
- **Example**: "Document with photos"

### **LOW** (Gray) 💡
- Nice-to-know tips
- Productivity hacks
- Keyboard shortcuts
- **Example**: "Add app to home screen"

---

## 🔧 Adding Custom Hints

### Via SQL

```sql
INSERT INTO hints_library (
    category, 
    priority, 
    title, 
    message, 
    icon, 
    page_path, 
    show_once
) VALUES (
    'estimates',
    'high',
    'Your Custom Tip Title',
    'Your helpful message here! Use emojis 🎉 and clear language.',
    'lightbulb',
    '/business/estimates.*',
    false
);
```

### Category Options
- `estimates`, `projects`, `team_management`, `payments`, `tax_planning`
- `community`, `profile`, `scheduling`, `communication`, `photography`
- `milestones`, `general`

### Page Path Patterns (Regex)
- `'/business/estimates.*'` - All estimate pages
- `'/business/projects/.*/active'` - Active project pages only
- `'.*'` - All pages
- `'/tax/.*'` - All tax pages

---

## 📊 Hint Analytics

### View Hint Performance

```sql
SELECT * FROM hint_statistics
ORDER BY users_shown DESC;
```

Returns:
- How many users saw each hint
- How many dismissed it
- Average views per user
- Average helpfulness rating

### Find Unpopular Hints

```sql
SELECT 
    title,
    users_shown,
    users_dismissed,
    (users_dismissed::float / NULLIF(users_shown, 0) * 100) as dismiss_rate
FROM hint_statistics
WHERE users_shown > 10
ORDER BY dismiss_rate DESC
LIMIT 10;
```

---

## 🎯 Smart Targeting

### Show Hints Based on User Experience

```sql
-- Only show to users with fewer than 5 projects
INSERT INTO hint_display_rules (hint_id, rule_type, rule_operator, rule_value)
VALUES (
    'your-hint-id',
    'project_count',
    'less_than',
    '5'
);
```

### Show Hints Based on Time

```sql
-- Only show to new users (first 30 days)
INSERT INTO hint_display_rules (hint_id, rule_type, rule_operator, rule_value)
VALUES (
    'your-hint-id',
    'days_since_signup',
    'less_than',
    '30'
);
```

---

## ⚙️ Configuration Options

### HintsContainer Props

```tsx
<HintsContainer
    position="top"        // 'top' | 'bottom' | 'sidebar'
    maxHints={3}          // Max number of hints to show at once
/>
```

### HintBubble Features

- ✅ Auto-dismiss after 8 seconds (optional)
- ✅ Manual dismiss button
- ✅ "Was this helpful?" rating (1-5 stars)
- ✅ Action buttons with links
- ✅ Smooth fade-in/out animations
- ✅ Priority-based color coding

---

## 🚀 Best Practices

### 1. **Don't Overwhelm Users**
- Show max 2-3 hints per page
- Prioritize critical information first
- Use `show_once: true` for onboarding tips

### 2. **Write Clear, Actionable Tips**
- ✅ "Pay yourself as an employee"
- ❌ "Consider various compensation structures"

### 3. **Use Emojis & Icons Sparingly**
- One emoji per hint maximum
- Icons should match the message

### 4. **Test Hint Placement**
- Top position: Important page-specific tips
- Bottom position: Additional context
- Sidebar: Floating persistent tips

### 5. **Monitor Analytics**
- High dismiss rate = hint is annoying or irrelevant
- Low rating = rewrite the hint
- High seen count + high rating = great hint!

---

## 🔒 Privacy & Compliance

- Hints are stored in database (not in code)
- Users can dismiss any hint
- No personal data collected
- Ratings are anonymous
- Complies with accessibility standards

---

## 📱 Mobile Optimization

Hints automatically adapt to mobile:
- Smaller fonts on mobile
- Touch-friendly dismiss buttons
- Collapsible sidebar on small screens
- Swipe-to-dismiss (optional)

---

## 🎓 Example Integration

### EstimatesView.tsx

```tsx
import HintsContainer from './HintsContainer';

export const EstimatesView = () => {
    return (
        <div className="p-6">
            <h1>Estimates</h1>
            
            {/* Hints appear here */}
            <HintsContainer position="top" maxHints={2} />
            
            <div className="estimate-list">
                {/* Your estimates */}
            </div>
        </div>
    );
};
```

**User sees**:
- 💡 "Pay yourself as an employee for easier tax accounting"
- ⚠️ "Include 10-15% contingency buffer"

---

## 🆘 Troubleshooting

### Hints not showing?

1. Check SQL function exists: `get_hints_for_user`
2. Verify hints are active: `SELECT * FROM hints_library WHERE is_active = true`
3. Check user hasn't dismissed: `SELECT * FROM user_hint_interactions WHERE profile_id = 'user-id'`
4. Verify page_path regex matches: Test pattern in SQL

### Hints showing on wrong pages?

Fix the `page_path` regex:
```sql
UPDATE hints_library
SET page_path = '/business/estimates.*'
WHERE id = 'hint-id';
```

---

## 🎉 You're Done!

Your app now has intelligent, contextual guidance that:
- ✅ Teaches users best practices
- ✅ Prevents common mistakes
- ✅ Answers questions proactively
- ✅ Improves user experience
- ✅ Increases feature adoption

Users will feel **supported and guided** rather than confused and lost! 🚀
