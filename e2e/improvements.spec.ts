import { test, expect } from '@playwright/test';
test('saved goals, workshop, reading settings and global cards work offline', async ({page,context})=>{
 await page.goto('/'); await expect(page.getByRole('heading',{name:'Today',exact:true})).toBeVisible({timeout:120000});
 await page.getByLabel('Your learning goal').selectOption('Backend'); await expect(page.getByLabel('Your learning goal')).toHaveValue('Backend'); await page.reload(); await expect(page.getByLabel('Your learning goal')).toHaveValue('Backend');
 await page.getByRole('button',{name:'Study Backend',exact:true}).click(); await expect(page).toHaveURL(/track=Backend/);
 await page.goto('/workshop');await expect(page.getByRole('heading',{name:'Guided workshop',exact:true})).toBeVisible();
 await page.getByRole('link',{name:/The older search response wins/}).click();await page.getByLabel('Your hypothesis or solution').fill('Only the active request should commit.');await page.reload();await expect(page.getByLabel('Your hypothesis or solution')).toHaveValue('Only the active request should commit.');await page.getByRole('button',{name:'Show reference explanation'}).click();await expect(page.getByText('Compare your reasoning')).toBeVisible();
 await page.goto('/settings');// The label wraps its <select>, so getByLabel's text includes the option texts; match by accessible name.
 await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('dark');await page.getByRole('combobox',{name:'Text size',exact:true}).selectOption('20');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.goto('/library');await page.getByLabel('Search cards',{exact:true}).fill('idempotency');await expect(page.locator('.content-panel').first()).toBeVisible();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await context.setOffline(true);await page.goto('/workshop/integration-idempotency');await expect(page.getByRole('heading',{name:'Reuse a request key without changing its meaning',exact:true})).toBeVisible();await context.setOffline(false);
});
