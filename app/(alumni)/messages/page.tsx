import { PageHeader } from '../../../components/ui/page-header';
import { SectionCard } from '../../../components/ui/section-card';

export default function MessagesPage() {
  return (
    <main className="mx-auto max-w-[1280px] bg-background p-6">
      <PageHeader
        description="Inbox placeholder for alumni messaging."
        title="Messages"
      />
      <SectionCard description="Messaging UI will be expanded in a later epic.">
        <p className="text-sm text-foreground-light">
          This route is currently protected by middleware and available to signed-in users.
        </p>
      </SectionCard>
    </main>
  );
}
