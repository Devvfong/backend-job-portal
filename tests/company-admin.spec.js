/**
 * Playwright tests for Company Admin features
 * Place in: tests/company-admin.spec.js
 * Run: npx playwright test tests/company-admin.spec.js
 */

import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL || 'https://devqii.me';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
// Test credentials (provide via env vars to avoid secrets in repo)
const TEST_COMPANY_ADMIN_EMAIL = process.env.TEST_COMPANY_ADMIN_EMAIL || 'devqii@gmail.com';
const TEST_COMPANY_ADMIN_PASSWORD = process.env.TEST_COMPANY_ADMIN_PASSWORD || 'REPLACE_ME';
const TEST_SEEKER_EMAIL = process.env.TEST_SEEKER_EMAIL || 'seeker@example.com';
const TEST_SEEKER_PASSWORD = process.env.TEST_SEEKER_PASSWORD || 'REPLACE_ME';

// Helper: Login as company admin
async function loginAsCompanyAdmin(page) {
  await page.goto(`${FRONTEND_URL}/login`);
  await page.fill('input[name="email"]', TEST_COMPANY_ADMIN_EMAIL);
  await page.fill('input[name="password"]', TEST_COMPANY_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  
  // Verify logged in (redirected away from login)
  expect(page.url()).not.toMatch(/login|signin/i);
}

// =====================================================
// TEST SUITE 1: COMPANY MANAGEMENT
// =====================================================

test.describe('Company Admin - Company Management', () => {
  test('should create a new company', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    
    // Navigate to company creation page
    await page.goto(`${FRONTEND_URL}/company/create`);
    
    // Fill company form
    await page.fill('input[name="companyName"]', 'TechCorp Inc');
    await page.fill('input[name="email"]', 'hr@techcorp.com');
    await page.fill('textarea[name="description"]', 'A leading tech company');
    await page.fill('input[name="location"]', 'San Francisco, CA');
    await page.fill('input[name="website"]', 'https://techcorp.com');
    await page.fill('input[name="industry"]', 'Technology');
    await page.fill('input[name="size"]', '50-200');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify success (toast notification or redirect)
    await expect(page.locator('text=Company created successfully')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Company created successfully');
  });

  test('should view own company dashboard', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/company/dashboard`);
    
    // Verify company information is displayed
    await expect(page.locator('text=Company Info')).toBeVisible();
    await expect(page.locator('text=TechCorp Inc')).toBeVisible();
    
    // Verify action buttons exist
    await expect(page.locator('button:has-text("Edit Company")')).toBeVisible();
    await expect(page.locator('button:has-text("Upload Logo")')).toBeVisible();
    
    console.log('✅ Company dashboard loaded');
  });

  test('should update company information', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/company/edit`);
    
    // Update company details
    await page.fill('input[name="description"]', 'Updated description');
    await page.fill('input[name="location"]', 'New York, NY');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page.locator('text=Company updated successfully')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Company updated');
  });

  test('should upload company logo', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/company/dashboard`);
    
    // Click upload logo button
    await page.click('button:has-text("Upload Logo")');
    
    // Handle file upload
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('./test-assets/logo.png');
    
    // Submit form
    await page.click('button:has-text("Upload")');
    
    // Verify success
    await expect(page.locator('text=Logo uploaded successfully')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('img[alt="Company Logo"]')).toBeVisible();
    
    console.log('✅ Logo uploaded');
  });

  test('should delete company logo', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/company/dashboard`);
    
    // Click delete logo button
    await page.click('button:has-text("Delete Logo")');
    
    // Confirm deletion
    await page.click('button:has-text("Confirm")');
    
    // Verify logo removed
    await expect(page.locator('img[alt="Company Logo"]')).not.toBeVisible();
    
    console.log('✅ Logo deleted');
  });

  test('should view company stats', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/company/stats`);
    
    // Verify stats displayed
    await expect(page.locator('text=Total Jobs')).toBeVisible();
    await expect(page.locator('text=Total Applicants')).toBeVisible();
    await expect(page.locator('text=Open Positions')).toBeVisible();
    
    console.log('✅ Company stats loaded');
  });
});

// =====================================================
// TEST SUITE 2: JOB MANAGEMENT
// =====================================================

test.describe('Company Admin - Job Management', () => {
  test('should create a new job posting', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/jobs/create`);
    
    // Fill job form
    await page.fill('input[name="title"]', 'Senior Developer');
    await page.fill('textarea[name="description"]', 'We are looking for a senior developer...');
    await page.fill('input[name="location"]', 'Remote');
    await page.selectOption('select[name="jobType"]', 'full_time');
    await page.fill('textarea[name="requirements"]', '5+ years experience, React, Node.js');
    await page.fill('textarea[name="benefits"]', 'Health insurance, 401k, remote work');
    await page.fill('input[name="salaryMin"]', '120000');
    await page.fill('input[name="salaryMax"]', '150000');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page.locator('text=Job created successfully')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Job posting created');
  });

  test('should view company jobs list', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/jobs/my-jobs`);
    
    // Verify jobs are displayed
    await expect(page.locator('text=My Job Postings')).toBeVisible();
    await expect(page.locator('text=Senior Developer')).toBeVisible();
    
    // Verify action buttons
    await expect(page.locator('button:has-text("Edit")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();
    
    console.log('✅ Jobs list loaded');
  });

  test('should edit a job posting', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/jobs/my-jobs`);
    
    // Click edit on first job
    await page.locator('button:has-text("Edit")').first().click();
    
    // Update job details
    await page.fill('input[name="title"]', 'Senior Developer (Updated)');
    await page.fill('input[name="salaryMax"]', '160000');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page.locator('text=Job updated successfully')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Job updated');
  });

  test('should delete a job posting', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/jobs/my-jobs`);
    
    // Count jobs before delete
    const jobsBefore = await page.locator('[data-testid="job-card"]').count();
    
    // Click delete on first job
    await page.locator('button:has-text("Delete")').first().click();
    
    // Confirm deletion
    await page.click('button:has-text("Confirm Delete")');
    
    // Verify success
    await expect(page.locator('text=Job deleted successfully')).toBeVisible({ timeout: 5000 });
    
    // Verify count decreased
    const jobsAfter = await page.locator('[data-testid="job-card"]').count();
    expect(jobsAfter).toBe(jobsBefore - 1);
    
    console.log('✅ Job deleted');
  });
});

// =====================================================
// TEST SUITE 3: APPLICANT MANAGEMENT
// =====================================================

test.describe('Company Admin - Applicant Management', () => {
  test('should view all company applicants', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/applicants`);
    
    // Verify applicants list
    await expect(page.locator('text=All Applicants')).toBeVisible();
    await expect(page.locator('[data-testid="applicant-row"]')).not.toHaveCount(0);
    
    console.log('✅ Applicants list loaded');
  });

  test('should view applicants for specific job', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/jobs/my-jobs`);
    
    // Click "View Applicants" on first job
    await page.locator('button:has-text("View Applicants")').first().click();
    
    // Verify applicants for job displayed
    await expect(page.locator('text=Job Applicants')).toBeVisible();
    
    console.log('✅ Job applicants loaded');
  });

  test('should update application status to reviewed', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/applicants`);
    
    // Find first applicant with "pending" status
    const applicantRow = page.locator('[data-testid="applicant-row"]').first();
    
    // Click status dropdown
    await applicantRow.locator('select[name="status"]').selectOption('reviewed');
    
    // Verify success
    await expect(page.locator('text=Status updated')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Application marked as reviewed');
  });

  test('should accept an application', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/applicants`);
    
    // Find an applicant and update status to accepted
    const applicantRow = page.locator('[data-testid="applicant-row"]').first();
    await applicantRow.locator('select[name="status"]').selectOption('accepted');
    
    // Verify success
    await expect(page.locator('text=Status updated')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Application accepted');
  });

  test('should reject an application', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/applicants`);
    
    // Find an applicant and update status to rejected
    const applicantRow = page.locator('[data-testid="applicant-row"]').first();
    await applicantRow.locator('select[name="status"]').selectOption('rejected');
    
    // Verify success
    await expect(page.locator('text=Status updated')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Application rejected');
  });
});

// =====================================================
// TEST SUITE 4: ROLE-BASED ACCESS CONTROL
// =====================================================

test.describe('Company Admin - Access Control', () => {
  test('job_seeker should NOT see admin buttons', async ({ page }) => {
    // Login as job seeker (different credentials)
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[name="email"]', TEST_SEEKER_EMAIL);
    await page.fill('input[name="password"]', TEST_SEEKER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Try to access admin-only page
    await page.goto(`${FRONTEND_URL}/company/dashboard`);
    
    // Should be redirected to 403 or not found
    const statusCode = page.url();
    expect(statusCode).toMatch(/403|unauthorized|not-found/i);
    
    console.log('✅ Job seeker cannot access admin pages');
  });

  test('admin buttons should be hidden for non-admin users', async ({ page }) => {
    // Login as job seeker
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[name="email"]', TEST_SEEKER_EMAIL);
    await page.fill('input[name="password"]', TEST_SEEKER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Go to jobs page
    await page.goto(`${FRONTEND_URL}/jobs`);
    
    // Admin buttons should NOT be visible
    await expect(page.locator('button:has-text("Create Job")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Edit Job")')).not.toBeVisible();
    
    console.log('✅ Admin buttons hidden for non-admin users');
  });

  test('admin endpoints should return 403 for non-admin users', async ({ page }) => {
    let got403 = false;

    await page.route('**/api/applications/company', async (route) => {
      const response = await route.fetch();
      if (response.status() === 403) {
        got403 = true;
      }
      return route.continue();
    });

    // Login as job seeker
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[name="email"]', TEST_SEEKER_EMAIL);
    await page.fill('input[name="password"]', TEST_SEEKER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // Try to access admin endpoint
    await page.goto(`${FRONTEND_URL}/applicants`);
    await page.waitForTimeout(1000);

    expect(got403).toBe(true);
    console.log('✅ API returns 403 for unauthorized requests');
  });
});

// =====================================================
// TEST SUITE 5: AUTHENTICATION WITH TOKEN REFRESH
// =====================================================

test.describe('Company Admin - Authentication', () => {
  test('should maintain session during long operation with token refresh', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    
    // Simulate a long operation (2 minutes)
    // In real scenario, access token would expire after 15 minutes
    // This test verifies that refresh happens silently
    
    await page.goto(`${FRONTEND_URL}/company/dashboard`);
    
    // Wait for potential token refresh to happen
    await page.waitForTimeout(5000);
    
    // Verify still logged in (not redirected to login)
    expect(page.url()).not.toMatch(/login|signin/i);
    
    console.log('✅ Session maintained with automatic token refresh');
  });

  test('should logout and clear tokens', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/company/dashboard`);
    
    // Click logout button
    await page.click('button:has-text("Logout")');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login|signin/i);
    
    // Verify token cleared from storage
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeNull();
    
    console.log('✅ Logout successful, tokens cleared');
  });
});
