import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('✓ Navigating to app...');
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => null);
  
  // Test 1: Profile dropdown closes on outside click
  console.log('\n📋 Test 1: Profile dropdown closes on outside click');
  const profileBtn = page.locator('app-topbar .profile-container button.icon-button').first();
  
  await profileBtn.click();
  await page.waitForTimeout(200);
  let dropdownVisible = await page.locator('app-topbar .dropdown-menu').isVisible();
  console.log(`  Dropdown opens: ${dropdownVisible ? '✓' : '✗'}`);
  
  // Click elsewhere
  await page.click('app-topbar .brand', { timeout: 5000 }).catch(() => page.click('body'));
  await page.waitForTimeout(200);
  dropdownVisible = await page.locator('app-topbar .dropdown-menu').isVisible();
  console.log(`  Dropdown closes on outside click: ${!dropdownVisible ? '✓' : '✗'}`);
  
  // Test 2: Profile button still toggles dropdown
  console.log('\n📋 Test 2: Profile button still toggles');
  await profileBtn.click();
  await page.waitForTimeout(200);
  dropdownVisible = await page.locator('app-topbar .dropdown-menu').isVisible();
  console.log(`  Dropdown reopens: ${dropdownVisible ? '✓' : '✗'}`);
  
  // Close dropdown
  await page.click('body');
  await page.waitForTimeout(200);
  
  // Test 3: Cart form changes
  console.log('\n📋 Test 3: Cart form (no delivery/payment selects)');
  const cartBtn = page.locator('app-topbar button.carrito-toggle');
  await cartBtn.click();
  await page.waitForTimeout(500);
  
  const hasDeliverySelect = await page.locator('select').filter({ hasText: 'Domicilio' }).count() > 0;
  const hasPaymentSelect = await page.locator('select').filter({ hasText: 'Tarjeta' }).count() > 0;
  const hasAddressField = await page.locator('label:has-text("Dirección")').count() > 0;
  
  console.log(`  Delivery type select removed: ${!hasDeliverySelect ? '✓' : '✗'}`);
  console.log(`  Payment type select removed: ${!hasPaymentSelect ? '✓' : '✗'}`);
  console.log(`  Address field visible: ${hasAddressField ? '✓' : '✗'}`);
  
  await browser.close();
  console.log('\n✅ All tests completed!');
  process.exit(0);
})();
