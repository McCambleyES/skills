---
name: iso-plain-language
description: Write human-facing text in plain language that follows ISO 24495-1:2023. Use when writing or revising anything a person will read, such as replies, summaries, docs, READMEs, PR descriptions, commit messages, error messages, UI copy, emails or reports. Also use when the user asks for plain language, clearer writing, or ISO 24495.
---

# ISO plain language (ISO 24495-1:2023)

A text is in plain language when its intended readers can easily **find** what they need, **understand** what they find, and **use** that information.

## Scope

Apply this skill to text a person will read. Do not apply it to internal reasoning, tool calls, code, or machine-readable output such as JSON or config files. Keep code, commands, paths and identifiers exact. Plain language never means changing technical facts.

## The four principles

The standard has four governing principles. Work through them in order.

### 1. Relevant: readers get what they need

Before writing, decide:
- **Readers:** Who will read this? What do they already know? What words do they use?
- **Purpose:** What should readers know, do or decide after reading it?
- **Context:** Where and when will they read it? Are they scanning a terminal, reviewing a PR, or reading under time pressure?

Then select content:
- Include what readers need to reach the purpose. Leave out the rest.
- Don't drop facts that affect decisions, such as risks, caveats, failures, assumptions or side effects.
- If readers will need related information, link to it or say where to find it.

### 2. Findable: readers can easily find what they need

- **Put the most important information first:** the answer, result, decision or required action. Supporting detail comes after.
- **Structure for the reader's task, not your process.** Order steps the way readers will do them. Order other content by importance to the reader.
- **Use headings** when a text has more than one section. Make headings informative ("How to roll back," not "Rollback"). Questions work well as headings.
- **Keep related information together.** Don't make readers jump between places.
- **Keep it short.** Every extra sentence makes the important ones harder to find.

### 3. Understandable: readers can easily understand it

**Words**
- Use common, familiar words: "use" not "utilize", "start" not "initiate", "about" not "approximately", "so" not "therefore".
- Use technical terms only when readers know them or need them. Define an unfamiliar term the first time you use it.
- Use the same term for the same thing every time. Don't alternate between synonyms.
- Spell out abbreviations on first use unless every reader knows them.
- Prefer verbs to nouns made from verbs: "decide" not "make a decision", "configure" not "perform configuration".
- Avoid noun stacks ("user session token refresh failure handling"). Break them up with verbs and prepositions.

**Sentences**
- One main idea per sentence. Aim for about 15–20 words on average, and split sentences over about 25 words.
- Use active voice and name who acts: "The build deletes old files," not "Old files are deleted."
- Put the subject and verb close together and near the start.
- Write in the positive. Avoid double negatives ("not uncommon" → "common").
- Address the reader as "you" when giving instructions.

**Paragraphs and cohesion**
- One topic per paragraph. Start with the sentence that states it.
- Keep paragraphs short, usually 1–4 sentences.
- Use clear connecting words (because, so, but, then, for example) so readers can follow the logic.

### 4. Usable: readers can easily use it

- **Make actions explicit.** Say exactly what readers must do, in imperative form ("Run `npm install`").
- **Use numbered lists for steps**, one action per step, in the order readers do them.
- **Use bulleted lists** for 3 or more parallel items. Keep list items grammatically parallel.
- **Use tables** to compare options or show values across several attributes.
- **Give concrete examples** when a rule or concept is abstract.
- **Use emphasis sparingly.** Bold only what readers must not miss.
- **Check the result** (see below). If readers could misread or misuse it, revise.

## Review checklist

Check the draft before you send it:

- [ ] Does the first sentence or section give readers the main point or action?
- [ ] Is every section needed for the reader's purpose?
- [ ] Are all decision-relevant facts present, such as risks, caveats and failures?
- [ ] Can a reader scanning headings and first sentences find what they need?
- [ ] Are words common, terms consistent, and unfamiliar terms defined?
- [ ] Are sentences short, active and one idea each?
- [ ] Are steps numbered, in order, one action each?
- [ ] Could a reader act on this without asking a follow-up question?

## Example

**Before**
> It should be noted that the utilization of the legacy authentication endpoint has been deprecated, and failure to perform migration prior to the end of the current quarter may result in service disruption for users.

**After**
> The legacy login endpoint stops working on March 31. To avoid outages, move to the new endpoint before then:
> 1. Replace `/auth/v1/login` with `/auth/v2/login`.
> 2. Run the login tests.
