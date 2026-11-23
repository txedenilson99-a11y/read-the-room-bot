import { createServerFn } from "@tanstack/react-start";
import { requireAprovado } from "./require-aprovado";
import { validateStoryInput } from "./psicologia-story.validation";

export const analisarPsicologiaStory = createServerFn({ method: "POST" })
  .middleware([requireAprovado])
  .inputValidator(validateStoryInput)
  .handler(async ({ data }) => {
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) throw new Error("A IA não está configurada no servidor.");
    const { generateStory } = await import("./psicologia-story.server");
    return { result: await generateStory(apiKey, data) };
  });
