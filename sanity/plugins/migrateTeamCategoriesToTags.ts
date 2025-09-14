import { DocumentActionComponent, DocumentActionProps } from 'sanity';
import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '../env';

// Naive detector: if category title matches a known team-like pattern, treat it as a team category
const TEAM_WORDS = [
  'Cardinals','Falcons','Ravens','Bills','Panthers','Bears','Bengals','Browns','Cowboys','Broncos','Lions','Packers','Texans','Colts','Jaguars','Chiefs','Chargers','Rams','Raiders','Dolphins','Vikings','Patriots','Saints','Giants','Jets','Eagles','Steelers','Seahawks','49ers','Buccaneers','Titans','Commanders'
];

function isTeamCategory(title?: string): boolean {
  if (!title) return false;
  const t = title.toLowerCase();
  return TEAM_WORDS.some(w => t.includes(w.toLowerCase()))
}

export const migrateTeamCategoryToTagAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const { draft, published } = props;
  const doc = (draft || published) as { _id?: string; _type?: string; title?: string; slug?: { current?: string } } | undefined;
  if (!doc || doc._type !== 'category') return null;
  if (!isTeamCategory(doc.title)) return null; // only show for team-like categories

  return {
    label: 'Migrate: Category → Tag',
    title: 'Convert this team category to a tag and reassign articles',
    onHandle: async () => {
      const client = createClient({ projectId, dataset, apiVersion, useCdn: false });
      const categoryId = doc._id?.replace('drafts.', '') as string;
      const tagTitle = doc.title as string;

      // 1) Ensure tag exists (create if missing)
      let tag = await client.fetch<{ _id: string } | null>(`*[_type == "tag" && title == $title][0]{ _id }`, { title: tagTitle });
      if (!tag) {
        const tagId = `tag-${(tagTitle || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}`;
        await client.createIfNotExists({ _id: tagId, _type: 'tag', title: tagTitle, slug: { _type: 'slug', current: tagId.replace(/^tag-/, '') } });
        tag = { _id: tagId };
      }

      // 2) Find headlines/fantasy pointing to this category
      const headlines = await client.fetch<{ _id: string; tags?: string[] }[]>(
        `*[_type in ["headline","fantasyFootball"] && category._ref == $categoryId]{ _id, tags }`,
        { categoryId }
      );

      // 3) For each doc: add tag title to tags[] (string array) and unset category
      const tx = client.transaction();
      headlines.forEach((h) => {
        const tags = Array.isArray(h.tags) ? h.tags : [];
        if (!tags.includes(tagTitle)) tags.push(tagTitle);
        tx.patch(h._id, (p) => p.set({ tags }).unset(['category']));
      });

      // 4) Optionally, delete the category (or you can keep it disabled)
      // tx.delete(categoryId);

      await tx.commit();

      props.onComplete?.();
      // @ts-expect-error optional toast
      props?.toast?.push?.({ status: 'success', title: `Migrated ${headlines.length} docs from category → tag` });
    }
  };
};
