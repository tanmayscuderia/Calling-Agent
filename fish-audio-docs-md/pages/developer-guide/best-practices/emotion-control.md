# Emotion & Expression Control

Source: https://docs.fish.audio/developer-guide/best-practices/emotion-control

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#overview)

Overview

Control how your AI voice expresses emotions, from happy and excited to sad and contemplative. Add natural pauses, laughter, and other human-like elements to make speech more engaging.

The `(parenthesis)` syntax on this page applies to the S1 model. S2 uses `[bracket]` syntax with natural language descriptions and is not limited to a fixed set of tags. See the [Models Overview](https://docs.fish.audio/developer-guide/models-pricing/models-overview#s2-natural-language-control) for details.

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#how-to-use)

How to Use

Simply wrap emotion tags in parentheses before your text:

```
(happy) What a beautiful day!
(sad) I'm sorry to hear that.
(excited) This is amazing news!
```

Include tone markers or audio effects:

```
(whispering) Let me tell you something.
(laughing) Ha ha ha, wow that's so funny!
```

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#important-rules)

Important Rules

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#placement-matters)

Placement Matters

**For all languages:**

-   Emotion tags MUST go at the beginning of sentences
-   Tone controls can go anywhere in the text
-   Sound effects can go anywhere in the text

**Correct:**

```
(happy) What a wonderful day!
```

**Incorrect:**

```
What a (happy) wonderful day!
```

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#best-practices)

Best Practices

**Do:**

-   Use one emotion per sentence
-   Add sounds after relevant words
-   Keep tags simple and clear
-   Test different combinations

**Don’t:**

-   Overuse tags in short text
-   Mix conflicting emotions
-   Create custom tags
-   Forget the parentheses

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#available-emotions)

Available Emotions

See the [Emotion Control guide](https://docs.fish.audio/developer-guide/core-features/emotions) for the full list of supported emotions.

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#scene-examples)

Scene Examples

**Customer Service:**

```
(friendly) Hello! How can I help you today?
(empathetic) I understand your frustration.
(confident) I'll resolve this for you right away.
```

**Storytelling:**

```
(mysterious)(whispering) Once upon a midnight dreary...
(excited) Suddenly, the door burst open!
(scared)(shouting) Run for your lives!
```

**Educational Content:**

```
(enthusiastic) Welcome to today's lesson!
(curious) Have you ever wondered why the sky is blue?
(proud) Great job! You got it right!
```

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#real-world-examples)

Real-World Examples

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#virtual-assistant)

Virtual Assistant

```
(friendly) Good morning! 
(helpful) I've prepared your schedule for today.
(concerned) You have three urgent emails.
(encouraging) Let's tackle them together!
```

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#audiobook-narration)

Audiobook Narration

```
(narrator) Chapter One: The Beginning
(mysterious) The old house stood silent in the fog.
(scared)(whispering) "Is anyone there?" she asked.
(relieved)(sighing) No one answered. Phew.
```

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#game-character)

Game Character

```
(brave) I'll defeat the dragon!
(struggling)(panting) This is... harder than... I thought!
(triumphant)(shouting) Victory is mine!
(laughing) Ha ha ha!
```

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#advanced-techniques)

Advanced Techniques

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#emotion-transitions)

Emotion Transitions

Gradually change emotions:

```
(happy) I got the promotion!
(uncertain) But... it means moving away.
(sad) I'll miss everyone here.
```

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#background-effects)

Background Effects

Add atmosphere:

```
The comedy show was amazing (audience laughing)
Everyone was having fun (background laughter)
The crowd loved it (crowd laughing)
```

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#troubleshooting)

Troubleshooting

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#emotion-not-working)

Emotion Not Working?

1.  Check tag placement (beginning of sentence for emotions)
2.  Verify spelling exactly matches the list
3.  Don’t use quotes around tags
4.  Include parentheses

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#unnatural-sound)

Unnatural Sound?

-   Add appropriate text after sound tags
-   Don’t overuse in short sentences
-   Space out emotional changes
-   Test with different voices

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#tips-for-success)

Tips for Success

1.  **Start simple** - Use basic emotions first
2.  **Preview often** - Test how it sounds
3.  **Be consistent** - Keep character emotions logical
4.  **Less is more** - Don’t overuse tags

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#get-creative)

Get Creative

Experiment with combinations to create unique character voices and engaging narratives. The key is finding the right balance between emotional expression and natural speech flow.

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/emotion-control#support)

Support

Need help with emotions?

-   **Try it live:** [fish.audio](https://fish.audio/)
-   **Community:** [Discord](https://discord.gg/fish-audio)
-   **Email:** [support@fish.audio](mailto:support@fish.audio)

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/best-practices/emotion-control.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/best-practices/emotion-control)
