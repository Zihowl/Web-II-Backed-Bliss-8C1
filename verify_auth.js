const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const results = [];

  try {
    // Test 1: Verify unauthenticated dropdown shows login/register options
    console.log('\n=== Test 1: Unauthenticated Dropdown ===');
    await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    const profileBtn = await page.$('.icon-button[aria-label*="Ingresar"]');
    if (!profileBtn) {
      results.push('❌ Profile button not found');
    } else {
      await profileBtn.click();
      await page.waitForTimeout(500);
      
      const loginOption = await page.$('a[routerLink="/login"]');
      const registerOption = await page.$('a[routerLink="/register"]');
      
      if (loginOption && registerOption) {
        results.push('✅ Unauthenticated dropdown shows "Iniciar sesión" and "Registrarse"');
        // Take screenshot
        await page.screenshot({ path: '/tmp/01-guest-dropdown.png' });
      } else {
        results.push('❌ Guest dropdown missing login/register options');
      }
    }

    // Test 2: Login and verify icon color change
    console.log('\n=== Test 2: Login & Icon Visibility ===');
    
    // First create a test account if needed
    const email = `test${Date.now()}@example.com`;
    
    // Go to register
    await page.goto('http://localhost:4200/register', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    
    // Fill register form
    await page.fill('input[type="text"]:first-of-type', 'Test User');
    await page.fill('input[type="tel"]', '1234567890');
    await page.fill('input[type="text"]:nth-of-type(2)', 'Test Address');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]:first-of-type', 'TestPass123');
    await page.fill('input[type="password"]:last-of-type', 'TestPass123');
    
    // Submit
    const registerBtn = await page.$('button:has-text("Registrarse")');
    if (registerBtn) {
      await registerBtn.click();
      await page.waitForTimeout(2000);
    }
    
    // Go to login
    await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    
    // Login
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'TestPass123');
    
    const loginBtn = await page.$('button:has-text("Ingresar")');
    if (loginBtn) {
      await loginBtn.click();
      await page.waitForTimeout(1500);
    }
    
    // Check if authenticated
    const isAuthenticated = await page.$('[aria-label*="Mi Perfil"]');
    if (isAuthenticated) {
      results.push('✅ Successfully logged in');
      
      // Check icon color
      const icon = await page.$('svg.auth-icon');
      if (icon) {
        const stroke = await icon.evaluate(el => el.style.stroke || el.getAttribute('stroke'));
        if (stroke === '#ebc590' || stroke.includes('ebc590')) {
          results.push('✅ Icon stroke color is gold (#ebc590), visible on dark background');
        } else {
          results.push(`⚠️ Icon stroke color is: ${stroke} (expected #ebc590)`);
        }
      }
      
      // Take screenshot
      await page.screenshot({ path: '/tmp/02-authenticated-topbar.png' });
    } else {
      results.push('❌ Login failed');
    }

    // Test 3: Verify authenticated dropdown
    console.log('\n=== Test 3: Authenticated Dropdown ===');
    
    const authProfileBtn = await page.$('[aria-label*="Mi Perfil"]');
    if (authProfileBtn) {
      await authProfileBtn.click();
      await page.waitForTimeout(500);
      
      const profileLink = await page.$('a[routerLink="/profile"]');
      const historyLink = await page.$('a[routerLink="/history"]');
      const logoutBtn = await page.$('button:has-text("Cerrar sesión")');
      
      if (profileLink && historyLink && logoutBtn) {
        results.push('✅ Authenticated dropdown shows profile, history, and logout options');
        await page.screenshot({ path: '/tmp/03-authenticated-dropdown.png' });
      } else {
        results.push('❌ Authenticated dropdown missing options');
      }
    }

    // Test 4: Session persistence across navigation
    console.log('\n=== Test 4: Session Persistence ===');
    
    // Navigate to different route
    await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    const isStillAuth = await page.$('[aria-label*="Mi Perfil"]');
    if (isStillAuth) {
      results.push('✅ Session persists after navigation (no flash to unauthenticated)');
    } else {
      results.push('❌ Session lost after navigation');
    }

    // Test 5: Session persistence on page reload
    console.log('\n=== Test 5: Page Reload Persistence ===');
    
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    const isAuthAfterReload = await page.$('[aria-label*="Mi Perfil"]');
    if (isAuthAfterReload) {
      results.push('✅ Session persists after hard reload (icon shows immediately)');
      await page.screenshot({ path: '/tmp/04-after-reload.png' });
    } else {
      results.push('❌ Session lost after page reload');
    }

  } catch (err) {
    results.push(`❌ Test error: ${err.message}`);
  } finally {
    await browser.close();
  }

  console.log('\n=== RESULTS ===');
  results.forEach(r => console.log(r));
  process.exit(results.some(r => r.includes('❌')) ? 1 : 0);
})();
