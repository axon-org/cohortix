import { redirect } from 'next/navigation';

export default async function MyTasksRedirect({
  params,
}: {
  params: { orgSlug: string };
}) {
  const { orgSlug } = await params;
  return redirect(`/my-tasks?filter=org:${orgSlug}`);
}
