import { test, expect } from '@playwright/test';
import { nanoid } from 'nanoid';

test('main flows of Banque Mondiale app', async ({ page }) => {
  const testId = nanoid(6);
  const testName = `Test ${testId}`;
  const testEmail = `${testId}@test.com`;
  const testPassword = 'TestPassword123!';

  // 2. Navigate to the homepage
  await page.goto('http://localhost:5000');

  // 3. Verify homepage
  await expect(page).toHaveTitle(/Banque Mondiale/i);
  await expect(page.getByText('BANQUE MONDIALE')).toBeVisible();
  
  const loginBtn = page.getByRole('button', { name: /Se connecter/i });
  const registerBtn = page.getByRole('button', { name: /Ouvrir un compte/i });
  
  await expect(loginBtn).toBeVisible();
  await expect(registerBtn).toBeVisible();

  // Check for cookie consent
  const cookieConsent = page.getByText(/En continuant votre navigation/i);
  if (await cookieConsent.isVisible()) {
    // 4. Dismiss cookie consent
    const acceptBtn = page.getByRole('button', { name: /Tout accepter|Accepter/i });
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
    } else {
      const refuseBtn = page.getByRole('button', { name: /Continuer sans accepter/i });
      if (await refuseBtn.isVisible()) {
        await refuseBtn.click();
      }
    }
  }

  // 5. Click "Ouvrir un compte"
  await registerBtn.click();

  // 6. Verify registration form loads
  // It seems it goes through a flow: /open-account-offer -> /open-account-steps -> /register
  if (page.url().includes('open-account-offer')) {
      await page.getByRole('button', { name: /Choisir cette offre/i }).first().click();
  }
  
  if (page.url().includes('open-account-steps')) {
      await page.getByRole('button', { name: /Continuer/i }).click();
  }

  // Now we should be at /register
  // Step 1: Email
  await page.waitForURL(/register/);
  await page.getByPlaceholder(/Votre adresse e-mail/i).fill(testEmail);
  await page.getByRole('button', { name: /Suivant/i }).click();

  // Step 2: Identity
  await page.getByRole('button', { name: /Monsieur/i }).click();
  await page.getByPlaceholder(/Prénom/i).fill('Test');
  await page.getByPlaceholder(/Nom de naissance/i).fill(testId);
  await page.getByRole('button', { name: /Suivant/i }).click();

  // Step 3: Contact
  await page.getByPlaceholder(/Téléphone portable/i).fill('612345678');
  await page.getByPlaceholder(/Code postal/i).fill('75001 Paris');
  await page.getByText(/Je certifie avoir vérifié mon adresse email/i).click();
  await page.getByRole('button', { name: /Suivant/i }).click();

  // Step 4: Password
  await page.getByPlaceholder(/^Mot de passe/i).fill(testPassword);
  await page.getByPlaceholder(/Confirmez votre mot de passe/i).fill(testPassword);
  await page.getByRole('button', { name: /Suivant/i }).click();

  // Step 5: Summary & Submit
  await expect(page.getByText(/Récapitulatif de votre demande/i)).toBeVisible();
  await page.getByRole('button', { name: /Valider et ouvrir mon compte/i }).click();

  // 9. Assert registration succeeds
  await page.waitForURL(/dashboard/);
  
  // 11. Assert dashboard loads with balance information
  await expect(page.getByText(/Solde total/i)).toBeVisible();
  await expect(page.getByText(/EUR/i)).toBeVisible();
});
