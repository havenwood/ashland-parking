import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const ordinance = defineCollection({
  loader: glob({ pattern: 'ordinance.md', base: './src/content' }),
  schema: z.object({
    title: z.string(),
    codeSection: z.string(),
    codeTitle: z.string(),
    annotation: z.string(),
    charter: z.string(),
    findings: z.array(z.string()).length(3),
  }),
});

export const collections = { ordinance };
