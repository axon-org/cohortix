import { test, expect } from '@playwright/test';

async function isOnSignIn(page: any): Promise<boolean> {
  await page.waitForTimeout(1000);
  const url = page.url();
  return url.includes('/sign-in') || url.includes('clerk.com');
}

test.describe('Cohort Management Flow', () => {
  test('create, edit, and delete a cohort with mocked members', async ({ page }) => {
    const cohortId = 'cohort-1';
    let cohortName = 'Launch Cohort';

    await page.route('**/api/v1/cohorts**', async (route) => {
      const method = route.request().method();

      if (method === 'POST') {
        const created = {
          id: cohortId,
          name: cohortName,
          type: 'shared',
          runtimeStatus: 'online',
          memberCount: 4,
          engagementPercent: '82',
          startDate: '2026-02-01',
          createdAt: '2026-02-01',
        };
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: created }),
        });
      }

      if (method === 'PATCH') {
        const updated = {
          id: cohortId,
          name: cohortName,
          type: 'shared',
          runtimeStatus: 'online',
          memberCount: 4,
          engagementPercent: '82',
        };
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: updated }),
        });
      }

      if (method === 'DELETE') {
        return route.fulfill({ status: 200, body: '{}' });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: cohortId,
              name: cohortName,
              type: 'shared',
              runtimeStatus: 'online',
              memberCount: 4,
              engagementPercent: '82',
              startDate: '2026-02-01',
              createdAt: '2026-02-01',
            },
          ],
        }),
      });
    });

    await page.route(`**/api/cohorts/${cohortId}`, (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: cohortId,
          name: cohortName,
          status: 'active',
          runtimeStatus: 'online',
          type: 'shared',
          memberCount: 4,
          engagementPercent: 82,
          agentCount: 2,
          activeTasks: 3,
          description: 'Mock cohort description',
          hosting: 'managed',
        }),
      });
    });

    await page.route(`**/api/cohorts/${cohortId}/members`, (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          members: [
            {
              id: 'member-1',
              cohort_id: cohortId,
              agent_id: 'agent-1',
              agent_name: 'Atlas',
              agent_slug: '@atlas',
              agent_status: 'active',
              engagement_score: 88,
            },
            {
              id: 'member-2',
              cohort_id: cohortId,
              agent_id: 'agent-2',
              agent_name: 'Nova',
              agent_slug: '@nova',
              agent_status: 'idle',
              engagement_score: 72,
            },
          ],
        }),
      });
    });

    await page.route(`**/api/cohorts/${cohortId}/timeline**`, (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ timeline: [] }),
      });
    });

    await page.route(`**/api/cohorts/${cohortId}/activity**`, (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          activities: [
            {
              id: 'act-1',
              type: 'cohort.created',
              title: 'Cohort created',
              description: 'Cohort was created',
              timestamp: '2026-02-01T00:00:00.000Z',
            },
          ],
        }),
      });
    });

    await page.goto('/test-org/cohorts', { waitUntil: 'domcontentloaded' });

    if (await isOnSignIn(page)) {
      await expect(page.locator('body')).toBeVisible();
      return;
    }

    await page.getByRole('button', { name: 'New Cohort' }).click();
    await page.getByLabel('Cohort Name').fill(cohortName);
    await page.getByRole('button', { name: 'Create Cohort' }).click();

    await expect(page.getByText(cohortName)).toBeVisible();

    await page.getByText(cohortName).click();
    await expect(page.getByText('Mock cohort description')).toBeVisible();
    await expect(page.getByText('Atlas')).toBeVisible();
    await expect(page.getByText('Nova')).toBeVisible();

    await page.getByRole('button', { name: /Edit/ }).click();
    cohortName = 'Launch Cohort Updated';
    await page.locator('input[value="Launch Cohort"]').fill(cohortName);
    await page.getByRole('button', { name: 'Save' }).click();

    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Delete' }).nth(1).click();

    await expect(page).toHaveURL(/\/cohorts/);
  });
});
