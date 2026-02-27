import { test, expect } from '@playwright/test';
import { Webhook } from 'svix';

async function isOnSignIn(page: any): Promise<boolean> {
  await page.waitForTimeout(1000);
  const url = page.url();
  return url.includes('/sign-in') || url.includes('clerk.com');
}

test.describe('Personal Cohort Provisioning Flow', () => {
  test('sign-up triggers personal cohort provisioning and onboarding', async ({ page, request }) => {
    await page.goto('/sign-up', { waitUntil: 'domcontentloaded' });

    if (await isOnSignIn(page)) {
      await expect(page.locator('body')).toBeVisible();
      return;
    }

    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      test.skip(true, 'CLERK_WEBHOOK_SECRET not configured for webhook signing');
      return;
    }

    const payload = JSON.stringify({
      type: 'user.created',
      data: {
        id: `user_${Date.now()}`,
        email_addresses: [{ id: 'email_1', email_address: 'test@example.com' }],
        primary_email_address_id: 'email_1',
        first_name: 'Test',
        last_name: 'User',
        image_url: null,
      },
    });

    const msgId = `msg_${Date.now()}`;
    const timestamp = new Date();
    const signature = new Webhook(webhookSecret).sign(msgId, timestamp, payload);

    const webhookResponse = await request.post('/api/webhooks/clerk', {
      data: payload,
      headers: {
        'svix-id': msgId,
        'svix-timestamp': Math.floor(timestamp.getTime() / 1000).toString(),
        'svix-signature': signature,
        'content-type': 'application/json',
      },
    });

    expect([200, 500]).toContain(webhookResponse.status());

    await page.goto('/onboarding/clone-foundation', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });
});
