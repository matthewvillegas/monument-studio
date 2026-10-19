import { z } from "zod";

const plainText = (maximum: number, multiline = false) =>
  z
    .string()
    .max(maximum, `Use no more than ${maximum} characters.`)
    .refine(
      (value) =>
        !(multiline
          ? /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/u
          : /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u
        ).test(value),
      "Use ordinary text without control characters.",
    )
    .optional();

const fields = z
  .object({
    familyReference: plainText(120),
    title: plainText(120),
    projectReference: plainText(80),
    description: plainText(1200, true),
    notes: plainText(3000, true),
  })
  .strict();

/** Proposal text is ephemeral, never merged into the version-1 design document. */
export const proposalDetailsSchema = z.preprocess((input, context) => {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return input;
  }
  const prototype = Object.getPrototypeOf(input);
  const unsafe =
    (prototype !== Object.prototype && prototype !== null) ||
    Reflect.ownKeys(input).some((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(input, key);
      return (
        typeof key !== "string" ||
        ["__proto__", "constructor", "prototype"].includes(key) ||
        !descriptor?.enumerable ||
        !("value" in descriptor)
      );
    });
  if (unsafe) {
    context.addIssue({ code: "custom", message: "Unexpected proposal structure." });
    return z.NEVER;
  }
  return input;
}, fields);

export type ProposalDetails = z.infer<typeof proposalDetailsSchema>;
