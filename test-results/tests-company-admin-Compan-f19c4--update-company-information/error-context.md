# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\company-admin.spec.js >> Company Admin - Company Management >> should update company information
- Location: tests\company-admin.spec.js:69:3

# Error details

```
Error: expect(received).not.toMatch(expected)

Expected pattern: not /login|signin/i
Received string:      "http://localhost:3000/login"
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - link "Devqii" [ref=e7] [cursor=pointer]:
            - /url: /
            - img "Devqii" [ref=e8]
          - generic [ref=e11]: Phase Alpha
        - generic [ref=e12]:
          - heading "Sign in to your destiny." [level=1] [ref=e13]:
            - text: Sign in to
            - text: your destiny.
          - paragraph [ref=e14]: Authentication required. Enter your credentials to access the elite network.
          - generic [ref=e15]:
            - generic [ref=e16]:
              - generic [ref=e18]: Work Email *
              - textbox "Work Email *" [ref=e20]:
                - /placeholder: ""
                - text: devqii@gmail.com
            - generic [ref=e21]:
              - generic [ref=e23]: Secret Password *
              - generic [ref=e24]:
                - textbox "Secret Password *" [ref=e25]:
                  - /placeholder: ""
                  - text: devqii123
                - button [ref=e27]:
                  - img [ref=e28]
            - generic [ref=e31]:
              - generic [ref=e32] [cursor=pointer]:
                - generic [ref=e33]:
                  - checkbox "Maintain Session" [ref=e34]
                  - img [ref=e36]
                - generic [ref=e39]: Maintain Session
              - link "Access Recovery" [ref=e40] [cursor=pointer]:
                - /url: /forgot-password
            - button "Authenticate ->" [ref=e41]:
              - generic [ref=e42]: Authenticate ->
          - generic [ref=e44]:
            - generic [ref=e47]: External Auth Nodes
            - generic [ref=e49]:
              - button "Github" [ref=e50]:
                - img [ref=e51]
                - text: Github
              - button "Linkedin" [ref=e53]:
                - img [ref=e54]
                - text: Linkedin
          - generic [ref=e56]:
            - img [ref=e57]
            - generic [ref=e60]: "Access Denied: Invalid email or password"
          - generic [ref=e61]:
            - paragraph [ref=e62]: New operative?
            - link "Initialize Onboarding" [ref=e63] [cursor=pointer]:
              - /url: /register
        - generic [ref=e64]:
          - generic [ref=e65]:
            - generic [ref=e66]:
              - img [ref=e67]
              - generic [ref=e70]: Auth Node 7.0
            - generic [ref=e71]:
              - img [ref=e72]
              - generic [ref=e75]: Global Secure
          - generic [ref=e76]: © 2026 DVQII
      - generic [ref=e77]:
        - generic [ref=e78]:
          - generic [ref=e79]: Authentication Hub
          - generic [ref=e81]: Secure Access Point
        - img "Office Background" [ref=e82]
        - generic [ref=e85]:
          - heading "\"The onboarding process is as elite as the companies on the platform. Truly a next-generation experience.\"" [level=3] [ref=e90]
          - generic [ref=e91]:
            - img "JULIAN WAN" [ref=e93]
            - generic [ref=e94]:
              - heading "JULIAN WAN" [level=4] [ref=e95]
              - paragraph [ref=e96]: FULL STACK CONSULTANT
  - button "Open Next.js Dev Tools" [ref=e102] [cursor=pointer]:
    - img [ref=e103]
  - alert [ref=e106]
```

# Test source

```ts
  1   | /**
  2   |  * Playwright tests for Company Admin features
  3   |  * Place in: tests/company-admin.spec.js
  4   |  * Run: npx playwright test tests/company-admin.spec.js
  5   |  */
  6   | 
  7   | import { test, expect } from '@playwright/test';
  8   | 
  9   | const BACKEND_URL = process.env.BACKEND_URL || 'https://devqii.me';
  10  | const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
  11  | 
  12  | // Helper: Login as company admin
  13  | async function loginAsCompanyAdmin(page) {
  14  |   await page.goto(`${FRONTEND_URL}/login`);
  15  |   await page.fill('input[name="email"]', 'devqii@gmail.com');
  16  |   await page.fill('input[name="password"]', 'devqii123');
  17  |   await page.click('button[type="submit"]');
  18  |   await page.waitForNavigation();
  19  |   
  20  |   // Verify logged in (redirected away from login)
> 21  |   expect(page.url()).not.toMatch(/login|signin/i);
      |                          ^ Error: expect(received).not.toMatch(expected)
  22  | }
  23  | 
  24  | // =====================================================
  25  | // TEST SUITE 1: COMPANY MANAGEMENT
  26  | // =====================================================
  27  | 
  28  | test.describe('Company Admin - Company Management', () => {
  29  |   test('should create a new company', async ({ page }) => {
  30  |     await loginAsCompanyAdmin(page);
  31  |     
  32  |     // Navigate to company creation page
  33  |     await page.goto(`${FRONTEND_URL}/company/create`);
  34  |     
  35  |     // Fill company form
  36  |     await page.fill('input[name="companyName"]', 'TechCorp Inc');
  37  |     await page.fill('input[name="email"]', 'hr@techcorp.com');
  38  |     await page.fill('textarea[name="description"]', 'A leading tech company');
  39  |     await page.fill('input[name="location"]', 'San Francisco, CA');
  40  |     await page.fill('input[name="website"]', 'https://techcorp.com');
  41  |     await page.fill('input[name="industry"]', 'Technology');
  42  |     await page.fill('input[name="size"]', '50-200');
  43  |     
  44  |     // Submit form
  45  |     await page.click('button[type="submit"]');
  46  |     
  47  |     // Verify success (toast notification or redirect)
  48  |     await expect(page.locator('text=Company created successfully')).toBeVisible({ timeout: 5000 });
  49  |     
  50  |     console.log('✅ Company created successfully');
  51  |   });
  52  | 
  53  |   test('should view own company dashboard', async ({ page }) => {
  54  |     await loginAsCompanyAdmin(page);
  55  |     
  56  |     await page.goto(`${FRONTEND_URL}/company/dashboard`);
  57  |     
  58  |     // Verify company information is displayed
  59  |     await expect(page.locator('text=Company Info')).toBeVisible();
  60  |     await expect(page.locator('text=TechCorp Inc')).toBeVisible();
  61  |     
  62  |     // Verify action buttons exist
  63  |     await expect(page.locator('button:has-text("Edit Company")')).toBeVisible();
  64  |     await expect(page.locator('button:has-text("Upload Logo")')).toBeVisible();
  65  |     
  66  |     console.log('✅ Company dashboard loaded');
  67  |   });
  68  | 
  69  |   test('should update company information', async ({ page }) => {
  70  |     await loginAsCompanyAdmin(page);
  71  |     
  72  |     await page.goto(`${FRONTEND_URL}/company/edit`);
  73  |     
  74  |     // Update company details
  75  |     await page.fill('input[name="description"]', 'Updated description');
  76  |     await page.fill('input[name="location"]', 'New York, NY');
  77  |     
  78  |     // Submit
  79  |     await page.click('button[type="submit"]');
  80  |     
  81  |     // Verify success
  82  |     await expect(page.locator('text=Company updated successfully')).toBeVisible({ timeout: 5000 });
  83  |     
  84  |     console.log('✅ Company updated');
  85  |   });
  86  | 
  87  |   test('should upload company logo', async ({ page }) => {
  88  |     await loginAsCompanyAdmin(page);
  89  |     
  90  |     await page.goto(`${FRONTEND_URL}/company/dashboard`);
  91  |     
  92  |     // Click upload logo button
  93  |     await page.click('button:has-text("Upload Logo")');
  94  |     
  95  |     // Handle file upload
  96  |     const fileInput = await page.locator('input[type="file"]');
  97  |     await fileInput.setInputFiles('./test-assets/logo.png');
  98  |     
  99  |     // Submit form
  100 |     await page.click('button:has-text("Upload")');
  101 |     
  102 |     // Verify success
  103 |     await expect(page.locator('text=Logo uploaded successfully')).toBeVisible({ timeout: 5000 });
  104 |     await expect(page.locator('img[alt="Company Logo"]')).toBeVisible();
  105 |     
  106 |     console.log('✅ Logo uploaded');
  107 |   });
  108 | 
  109 |   test('should delete company logo', async ({ page }) => {
  110 |     await loginAsCompanyAdmin(page);
  111 |     
  112 |     await page.goto(`${FRONTEND_URL}/company/dashboard`);
  113 |     
  114 |     // Click delete logo button
  115 |     await page.click('button:has-text("Delete Logo")');
  116 |     
  117 |     // Confirm deletion
  118 |     await page.click('button:has-text("Confirm")');
  119 |     
  120 |     // Verify logo removed
  121 |     await expect(page.locator('img[alt="Company Logo"]')).not.toBeVisible();
```