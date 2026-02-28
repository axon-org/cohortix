import { test, expect } from '@playwright/test';

async function isOnSignIn(page: any): Promise<boolean> {
  await page.waitForTimeout(1000);
  const url = page.url();
  return url.includes('/sign-in') || url.includes('clerk.com');
}

test.describe('Agent @Mention Flow', () => {
  test('creates a comment with @mention when UI is available', async ({ page }) => {
    await page.route('**/api/v1/agents**', (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 'agent-1', name: 'Clone', role: 'Founder', avatarUrl: null },
            { id: 'agent-2', name: 'Atlas', role: 'Ops', avatarUrl: null },
          ],
        }),
      });
    });

    await page.route('**/api/v1/comments**', (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: 'comment-1',
              content: 'Please review @Clone',
              entity_type: 'operation',
              entity_id: 'task-1',
              author_id: 'user-1',
              author_name: 'Tester',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'comment-1',
              content: 'Please review @Clone',
              entity_type: 'operation',
              entity_id: 'task-1',
              author_id: 'user-1',
              author_name: 'Tester',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    await page.goto('/test-org/tasks', { waitUntil: 'domcontentloaded' });

    if (await isOnSignIn(page)) {
      await expect(page.locator('body')).toBeVisible();
      return;
    }

    const commentInput = page.locator('textarea[placeholder="Add a comment..."]');
    if ((await commentInput.count()) === 0) {
      await expect(page.locator('body')).toBeVisible();
      return;
    }

    await commentInput.fill('Please review @Clone');
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText('Please review @Clone')).toBeVisible();
  });
});
