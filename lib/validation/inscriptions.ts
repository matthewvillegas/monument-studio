import { z } from "zod";

export const INSCRIPTION_LIMITS = {
  coordinateIn: { min: -240, max: 240 },
  fontSizeIn: { min: 0.25, max: 12 },
  contentCharacters: {
    name: 80,
    dates: 80,
    epitaph: 160,
  },
} as const;

const coordinateSchema = z
  .number({ error: "Enter a numeric position." })
  .finite("Position must be a finite number.")
  .min(
    INSCRIPTION_LIMITS.coordinateIn.min,
    `Position must be at least ${INSCRIPTION_LIMITS.coordinateIn.min} in.`,
  )
  .max(
    INSCRIPTION_LIMITS.coordinateIn.max,
    `Position must be no more than ${INSCRIPTION_LIMITS.coordinateIn.max} in.`,
  );

const fontSizeSchema = z
  .number({ error: "Enter a numeric font size." })
  .finite("Font size must be a finite number.")
  .min(
    INSCRIPTION_LIMITS.fontSizeIn.min,
    `Font size must be at least ${INSCRIPTION_LIMITS.fontSizeIn.min} in.`,
  )
  .max(
    INSCRIPTION_LIMITS.fontSizeIn.max,
    `Font size must be no more than ${INSCRIPTION_LIMITS.fontSizeIn.max} in.`,
  );

function singleLineContent(maximumCharacters: number) {
  return z
    .string({ error: "Enter inscription text." })
    .max(maximumCharacters, `Use no more than ${maximumCharacters} characters.`)
    .refine((content) => !/[\r\n\u2028\u2029]/u.test(content), {
      message: "Use a single line of text.",
    });
}

const positionAndSize = {
  xIn: coordinateSchema,
  yIn: coordinateSchema,
  fontSizeIn: fontSizeSchema,
};

const nameInscriptionSchema = z
  .object({
    id: z.literal("name"),
    content: singleLineContent(INSCRIPTION_LIMITS.contentCharacters.name),
    ...positionAndSize,
  })
  .strict();

const datesInscriptionSchema = z
  .object({
    id: z.literal("dates"),
    content: singleLineContent(INSCRIPTION_LIMITS.contentCharacters.dates),
    ...positionAndSize,
  })
  .strict();

const epitaphInscriptionSchema = z
  .object({
    id: z.literal("epitaph"),
    content: singleLineContent(INSCRIPTION_LIMITS.contentCharacters.epitaph),
    ...positionAndSize,
  })
  .strict();

export const inscriptionElementSchema = z.discriminatedUnion("id", [
  nameInscriptionSchema,
  datesInscriptionSchema,
  epitaphInscriptionSchema,
]);

export const inscriptionElementsSchema = z
  .array(inscriptionElementSchema)
  .max(3, "A design can contain at most one inscription of each kind.")
  .superRefine((elements, context) => {
    const seenIds = new Set<string>();

    elements.forEach((element, index) => {
      if (seenIds.has(element.id)) {
        context.addIssue({
          code: "custom",
          path: [index, "id"],
          message: `Duplicate ${element.id} inscription.`,
        });
      }
      seenIds.add(element.id);
    });
  });

export type ValidatedInscriptionElement = z.infer<
  typeof inscriptionElementSchema
>;
