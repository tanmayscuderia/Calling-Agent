# Emotion Control

Source: https://docs.fish.audio/developer-guide/core-features/emotions

## Try it live in the API playground

Drop text with the markers below into the `text` field and send a real request to hear the emotion.

## 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#overview)

Overview

Fish Audio models support 64+ emotional expressions and voice styles that can be controlled through text markers in your input. Add natural pauses, laughter, and other human-like elements to make speech more engaging and realistic.

This page shows S2 usage with `[bracket]` cues. If you use the legacy S1 model, wrap markers in parentheses instead — see [S1 (legacy) syntax](https://docs.fish.audio/developer-guide/core-features/emotions#s1-legacy-syntax) below for the full list, or the [Models Overview](https://docs.fish.audio/developer-guide/models-pricing/models-overview#s2-natural-language-control).

## 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#how-it-works)

How It Works

Add emotional or stylistic cues in square brackets within your text:

```
[happy] What a beautiful day!
[sad] I'm sorry to hear that.
[excited] This is amazing news!
```

The S2 TTS models will interpret these markers and adjust the voice accordingly.

## 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#complete-emotion-reference)

Complete Emotion Reference

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#basic-emotions-24-expressions)

Basic Emotions (24 expressions)

| Emotion | Tag | Description | Example Context |
| --- | --- | --- | --- |
| Happy | `[happy]` | Cheerful, upbeat tone | Good news, greetings |
| Sad | `[sad]` | Melancholic, downcast | Sympathy, bad news |
| Angry | `[angry]` | Frustrated, aggressive | Complaints, warnings |
| Excited | `[excited]` | Energetic, enthusiastic | Announcements, celebrations |
| Calm | `[calm]` | Peaceful, relaxed | Instructions, meditation |
| Nervous | `[nervous]` | Anxious, uncertain | Disclaimers, apologies |
| Confident | `[confident]` | Assertive, self-assured | Presentations, sales |
| Surprised | `[surprised]` | Shocked, amazed | Reactions, discoveries |
| Satisfied | `[satisfied]` | Content, pleased | Confirmations, reviews |
| Delighted | `[delighted]` | Very pleased, joyful | Celebrations, compliments |
| Scared | `[scared]` | Frightened, fearful | Warnings, horror stories |
| Worried | `[worried]` | Concerned, troubled | Concerns, questions |
| Upset | `[upset]` | Disturbed, distressed | Complaints, problems |
| Frustrated | `[frustrated]` | Annoyed, exasperated | Technical issues, delays |
| Depressed | `[depressed]` | Very sad, hopeless | Serious topics |
| Empathetic | `[empathetic]` | Understanding, caring | Support, counseling |
| Embarrassed | `[embarrassed]` | Ashamed, awkward | Apologies, mistakes |
| Disgusted | `[disgusted]` | Repelled, revolted | Negative reviews |
| Moved | `[moved]` | Emotionally touched | Heartfelt moments |
| Proud | `[proud]` | Accomplished, satisfied | Achievements, praise |
| Relaxed | `[relaxed]` | At ease, casual | Casual conversation |
| Grateful | `[grateful]` | Thankful, appreciative | Thanks, appreciation |
| Curious | `[curious]` | Inquisitive, interested | Questions, exploration |
| Sarcastic | `[sarcastic]` | Ironic, mocking | Humor, criticism |

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#advanced-emotions-25-expressions)

Advanced Emotions (25 expressions)

| Emotion | Tag | Description | Example Context |
| --- | --- | --- | --- |
| Disdainful | `[disdainful]` | Contemptuous, scornful | Criticism, rejection |
| Unhappy | `[unhappy]` | Discontent, dissatisfied | Complaints, feedback |
| Anxious | `[anxious]` | Very worried, uneasy | Urgent matters |
| Hysterical | `[hysterical]` | Uncontrollably emotional | Extreme reactions |
| Indifferent | `[indifferent]` | Uncaring, neutral | Neutral responses |
| Uncertain | `[uncertain]` | Doubtful, unsure | Speculation, questions |
| Doubtful | `[doubtful]` | Skeptical, questioning | Disbelief, questioning |
| Confused | `[confused]` | Puzzled, perplexed | Clarification requests |
| Disappointed | `[disappointed]` | Let down, dissatisfied | Unmet expectations |
| Regretful | `[regretful]` | Sorry, remorseful | Apologies, mistakes |
| Guilty | `[guilty]` | Culpable, responsible | Confessions, apologies |
| Ashamed | `[ashamed]` | Deeply embarrassed | Serious mistakes |
| Jealous | `[jealous]` | Envious, resentful | Comparisons |
| Envious | `[envious]` | Wanting what others have | Admiration with desire |
| Hopeful | `[hopeful]` | Optimistic about future | Future plans |
| Optimistic | `[optimistic]` | Positive outlook | Encouragement |
| Pessimistic | `[pessimistic]` | Negative outlook | Warnings, doubts |
| Nostalgic | `[nostalgic]` | Longing for the past | Memories, stories |
| Lonely | `[lonely]` | Isolated, alone | Emotional content |
| Bored | `[bored]` | Uninterested, weary | Disinterest |
| Contemptuous | `[contemptuous]` | Showing contempt | Strong criticism |
| Sympathetic | `[sympathetic]` | Showing sympathy | Condolences |
| Compassionate | `[compassionate]` | Showing deep care | Support, help |
| Determined | `[determined]` | Resolved, decided | Goals, commitments |
| Resigned | `[resigned]` | Accepting defeat | Giving up, acceptance |

## 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#sound-&-delivery-markers)

Sound & Delivery Markers

These markers aren’t emotions — they shape _how_ a line is delivered, add natural human sounds, or layer in ambient effects. Combine them with the emotion cues above.

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#tone-markers-6-expressions)

Tone Markers (6 expressions)

Control volume, intensity, and emphasis. Place `[emphasis]` right before the word or phrase you want to stress:

```
This is [emphasis] really important.
```

| Tone | Tag | Description | When to Use |
| --- | --- | --- | --- |
| Hurried | `[in a hurry tone]` | Rushed, urgent | Time-sensitive information |
| Shouting | `[shouting]` | Loud, calling out | Getting attention |
| Screaming | `[screaming]` | Very loud, panicked | Emergencies, fear |
| Whispering | `[whispering]` | Very soft, secretive | Secrets, quiet scenes |
| Soft | `[soft tone]` | Gentle, quiet | Comfort, lullabies |
| Emphasis | `[emphasis]` | Stress a word/phrase | Highlighting key words |

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#audio-effects-11-expressions)

Audio Effects (11 expressions)

Add natural human sounds:

| Effect | Tag | Description | Suggested Text |
| --- | --- | --- | --- |
| Laughing | `[laughing]` | Full laughter | Ha, ha, ha |
| Chuckling | `[chuckling]` | Light laugh | Heh, heh |
| Sobbing | `[sobbing]` | Crying heavily | Optional text |
| Crying Loudly | `[crying loudly]` | Intense crying | Optional text |
| Sighing | `[sighing]` | Exhale of relief/frustration | sigh |
| Groaning | `[groaning]` | Sound of frustration | ugh |
| Panting | `[panting]` | Out of breath | huff, puff |
| Gasping | `[gasping]` | Sharp intake of breath | gasp |
| Yawning | `[yawning]` | Tired sound | yawn |
| Snoring | `[snoring]` | Sleep sound | zzz |
| Clear Throat | `[clear throat]` | Throat-clearing sound | ahem |

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#special-effects)

Special Effects

Additional markers for atmosphere and context:

| Effect | Tag | Description |
| --- | --- | --- |
| Audience Laughter | `[audience laughing]` | Crowd laughing sound |
| Background Laughter | `[background laughter]` | Ambient laughter |
| Crowd Laughter | `[crowd laughing]` | Large group laughing |
| Short Pause | `[break]` | Brief pause in speech |
| Long Pause | `[long-break]` | Extended pause in speech |

You can also use natural expressions like “Ha,ha,ha” for laughter without tags.

## 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#usage-guidelines)

Usage Guidelines

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#placement-rules)

Placement Rules

**For S2:**

-   Sentence-level emotion cues usually work best at the beginning of sentences
-   Tone controls can go anywhere in the text
-   Sound effects can go anywhere in the text
-   Bracket cues can use natural language descriptions and are not limited to a fixed set of tags

**Correct:**

```
[happy] What a wonderful day!
What a [warm and happy] wonderful day!
```

## 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#advanced-techniques)

Advanced Techniques

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#combining-effects)

Combining Effects

You can layer multiple emotions for complex expressions:

```
[sad][whispering] I miss you so much.
[angry][shouting] Get out of here now!
[excited][laughing] We won! Ha ha!
```

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#emotion-transitions)

Emotion Transitions

Create natural emotional progressions:

```
[happy] I got the promotion!
[uncertain] But... it means relocating.
[sad] I'll miss everyone here.
[hopeful] Though it's a great opportunity.
[determined] I'm going to make it work!
```

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#background-effects)

Background Effects

Add atmospheric sounds:

```
The comedy show was amazing [audience laughing]
Everyone was having fun [background laughter]
The crowd loved it [crowd laughing]
```

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#intensity-modifiers)

Intensity Modifiers

Fine-tune emotional intensity with descriptive modifiers:

```
[slightly sad] I'm a bit disappointed.
[very excited] This is absolutely amazing!
[extremely angry] This is unacceptable!
```

## 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#language-support)

Language Support

All 13 supported languages can use emotion markers. For sentence-level control, cues usually work best at the sentence start in these languages:

-   **English, Chinese, Japanese, German, French, Spanish, Korean, Arabic, Russian, Dutch, Italian, Polish, Portuguese**

## 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#best-practices)

Best Practices

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#do%E2%80%99s)

Do’s

-   Use one primary emotion per sentence
-   Test different emotion combinations
-   Match emotions to context logically
-   Add appropriate text after sound effects (e.g., “Ha ha” after laughing)
-   Use natural expressions when possible
-   Space out emotional changes for realism

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#don%E2%80%99ts)

Don’ts

-   Don’t overuse emotion tags in short text
-   Don’t mix conflicting emotions
-   Don’t make bracket descriptions so long that they interrupt readability
-   Don’t forget brackets
-   Don’t place sentence-level emotion cues far from the sentence they control

## 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#common-use-cases)

Common Use Cases

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#customer-service)

Customer Service

```
[friendly] Hello! How can I help you today?
[empathetic] I understand your frustration.
[confident] I'll resolve this for you right away.
[grateful] Thank you for your patience!
```

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#storytelling)

Storytelling

```
[narrator] Once upon a time...
[mysterious][whispering] The old house stood silent.
[scared] "Is anyone there?" she called out.
[relieved][sighing] No one answered. Phew.
```

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#educational-content)

Educational Content

```
[enthusiastic] Welcome to today's lesson!
[curious] Have you ever wondered why?
[encouraging] That's a great question!
[proud] Excellent work!
```

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#marketing-&-sales)

Marketing & Sales

```
[excited] Introducing our newest product!
[confident] You won't find better quality anywhere.
[urgent] Limited time offer!
[satisfied] Join thousands of happy customers!
```

## 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#troubleshooting)

Troubleshooting

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#emotion-not-working)

Emotion Not Working?

1.  **Check placement** - Put the cue where the emotion or effect should begin
2.  **Keep wording clear** - Use concise natural language descriptions
3.  **Use the right syntax** - S2 cues use square brackets; S1 cues must use parentheses

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#unnatural-sound)

Unnatural Sound?

-   Space out emotional changes
-   Use appropriate intensity
-   Test with different voices
-   Add context text after sound effects

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#performance-notes)

Performance Notes

-   Emotion markers don’t count toward token limits
-   No additional latency for emotion processing
-   All emotions available on all pricing tiers
-   Maximum of 3 combined emotions per sentence recommended

## 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#quick-reference-tables)

Quick Reference Tables

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#emotion-intensity-scale)

Emotion Intensity Scale

| Base Emotion | Mild | Moderate | Intense |
| --- | --- | --- | --- |
| Happy | satisfied | happy | delighted |
| Sad | disappointed | sad | depressed |
| Angry | frustrated | angry | furious |
| Scared | nervous | scared | terrified |
| Excited | interested | excited | ecstatic |

### 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#common-combinations)

Common Combinations

| Scenario | Emotion Combo | Example |
| --- | --- | --- |
| Whispered Secret | `[mysterious][whispering]` | ”I have something to tell you…” |
| Angry Shout | `[angry][shouting]` | ”Stop right there!” |
| Sad Sigh | `[sad][sighing]` | ”I wish things were different. Sigh.” |
| Excited Laugh | `[excited][laughing]` | ”We did it! Ha ha!” |
| Nervous Question | `[nervous][uncertain]` | ”Are you sure about this?” |

## 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#s1-legacy-syntax)

S1 (legacy) syntax

The **S2-Pro** and **S2.1-Pro** family models use `[bracket]` cues with free-form natural language. The previous-generation **S1** model uses the same emotion names but requires `(parentheses)` and a fixed tag set:

```
(happy) What a beautiful day!
(sad)(whispering) I'll miss you so much.
```

Basic emotions (S1)

| Emotion | Tag | Description | Example Context |
| --- | --- | --- | --- |
| Happy | `(happy)` | Cheerful, upbeat tone | Good news, greetings |
| Sad | `(sad)` | Melancholic, downcast | Sympathy, bad news |
| Angry | `(angry)` | Frustrated, aggressive | Complaints, warnings |
| Excited | `(excited)` | Energetic, enthusiastic | Announcements, celebrations |
| Calm | `(calm)` | Peaceful, relaxed | Instructions, meditation |
| Nervous | `(nervous)` | Anxious, uncertain | Disclaimers, apologies |
| Confident | `(confident)` | Assertive, self-assured | Presentations, sales |
| Surprised | `(surprised)` | Shocked, amazed | Reactions, discoveries |
| Satisfied | `(satisfied)` | Content, pleased | Confirmations, reviews |
| Delighted | `(delighted)` | Very pleased, joyful | Celebrations, compliments |
| Scared | `(scared)` | Frightened, fearful | Warnings, horror stories |
| Worried | `(worried)` | Concerned, troubled | Concerns, questions |
| Upset | `(upset)` | Disturbed, distressed | Complaints, problems |
| Frustrated | `(frustrated)` | Annoyed, exasperated | Technical issues, delays |
| Depressed | `(depressed)` | Very sad, hopeless | Serious topics |
| Empathetic | `(empathetic)` | Understanding, caring | Support, counseling |
| Embarrassed | `(embarrassed)` | Ashamed, awkward | Apologies, mistakes |
| Disgusted | `(disgusted)` | Repelled, revolted | Negative reviews |
| Moved | `(moved)` | Emotionally touched | Heartfelt moments |
| Proud | `(proud)` | Accomplished, satisfied | Achievements, praise |
| Relaxed | `(relaxed)` | At ease, casual | Casual conversation |
| Grateful | `(grateful)` | Thankful, appreciative | Thanks, appreciation |
| Curious | `(curious)` | Inquisitive, interested | Questions, exploration |
| Sarcastic | `(sarcastic)` | Ironic, mocking | Humor, criticism |

Advanced emotions (S1)

| Emotion | Tag | Description | Example Context |
| --- | --- | --- | --- |
| Disdainful | `(disdainful)` | Contemptuous, scornful | Criticism, rejection |
| Unhappy | `(unhappy)` | Discontent, dissatisfied | Complaints, feedback |
| Anxious | `(anxious)` | Very worried, uneasy | Urgent matters |
| Hysterical | `(hysterical)` | Uncontrollably emotional | Extreme reactions |
| Indifferent | `(indifferent)` | Uncaring, neutral | Neutral responses |
| Uncertain | `(uncertain)` | Doubtful, unsure | Speculation, questions |
| Doubtful | `(doubtful)` | Skeptical, questioning | Disbelief, questioning |
| Confused | `(confused)` | Puzzled, perplexed | Clarification requests |
| Disappointed | `(disappointed)` | Let down, dissatisfied | Unmet expectations |
| Regretful | `(regretful)` | Sorry, remorseful | Apologies, mistakes |
| Guilty | `(guilty)` | Culpable, responsible | Confessions, apologies |
| Ashamed | `(ashamed)` | Deeply embarrassed | Serious mistakes |
| Jealous | `(jealous)` | Envious, resentful | Comparisons |
| Envious | `(envious)` | Wanting what others have | Admiration with desire |
| Hopeful | `(hopeful)` | Optimistic about future | Future plans |
| Optimistic | `(optimistic)` | Positive outlook | Encouragement |
| Pessimistic | `(pessimistic)` | Negative outlook | Warnings, doubts |
| Nostalgic | `(nostalgic)` | Longing for the past | Memories, stories |
| Lonely | `(lonely)` | Isolated, alone | Emotional content |
| Bored | `(bored)` | Uninterested, weary | Disinterest |
| Contemptuous | `(contemptuous)` | Showing contempt | Strong criticism |
| Sympathetic | `(sympathetic)` | Showing sympathy | Condolences |
| Compassionate | `(compassionate)` | Showing deep care | Support, help |
| Determined | `(determined)` | Resolved, decided | Goals, commitments |
| Resigned | `(resigned)` | Accepting defeat | Giving up, acceptance |

Tone markers (S1)

| Tone | Tag | Description | When to Use |
| --- | --- | --- | --- |
| Hurried | `(in a hurry tone)` | Rushed, urgent | Time-sensitive information |
| Shouting | `(shouting)` | Loud, calling out | Getting attention |
| Screaming | `(screaming)` | Very loud, panicked | Emergencies, fear |
| Whispering | `(whispering)` | Very soft, secretive | Secrets, quiet scenes |
| Soft | `(soft tone)` | Gentle, quiet | Comfort, lullabies |

Audio effects (S1)

| Effect | Tag | Description | Suggested Text |
| --- | --- | --- | --- |
| Laughing | `(laughing)` | Full laughter | Ha, ha, ha |
| Chuckling | `(chuckling)` | Light laugh | Heh, heh |
| Sobbing | `(sobbing)` | Crying heavily | (optional) |
| Crying Loudly | `(crying loudly)` | Intense crying | (optional) |
| Sighing | `(sighing)` | Exhale of relief/frustration | sigh |
| Groaning | `(groaning)` | Sound of frustration | ugh |
| Panting | `(panting)` | Out of breath | huff, puff |
| Gasping | `(gasping)` | Sharp intake of breath | gasp |
| Yawning | `(yawning)` | Tired sound | yawn |
| Snoring | `(snoring)` | Sleep sound | zzz |

Special effects (S1)

| Effect | Tag | Description |
| --- | --- | --- |
| Audience Laughter | `(audience laughing)` | Crowd laughing sound |
| Background Laughter | `(background laughter)` | Ambient laughter |
| Crowd Laughter | `(crowd laughing)` | Large group laughing |
| Short Pause | `(break)` | Brief pause in speech |
| Long Pause | `(long-break)` | Extended pause in speech |

## 

[​

](https://docs.fish.audio/developer-guide/core-features/emotions#see-also)

See Also

-   [API Reference](https://docs.fish.audio/api-reference/introduction) - Implementation details
-   [Text-to-Speech Guide and Best Practices](https://docs.fish.audio/features/text-to-speech)

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/core-features/emotions.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/core-features/emotions)
