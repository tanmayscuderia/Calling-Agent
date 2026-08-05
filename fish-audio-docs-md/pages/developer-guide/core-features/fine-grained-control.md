# Fine-grained Control

Source: https://docs.fish.audio/developer-guide/core-features/fine-grained-control

## Try it live in the API playground

Put your phoneme or paralanguage tags into the `text` field and send a real request to hear the result.

## 

[​

](https://docs.fish.audio/developer-guide/core-features/fine-grained-control#getting-started)

Getting Started

To use fine-grained control, you can use either our SDK, API, or Playground. SDK/API: Phoneme tags are preserved by text normalization, so you can keep the default normalization behavior for pronunciation control. Set `"normalize": false` only when you want to prevent normalization from rewriting the surrounding text, such as numbers, dates, or URLs. Playground: You can use V1.6 Control Model, without setting any other options.

Disabling normalization may reduce the stability of reading numbers, dates, and URLs. You’ll need to handle these cases manually for best results.

## 

[​

](https://docs.fish.audio/developer-guide/core-features/fine-grained-control#phoneme-control)

Phoneme Control

Phoneme control allows you to specify exact pronunciations for words, characters, or short phrases. Wrap the desired pronunciation in `<|phoneme_start|>` and `<|phoneme_end|>` tags. The replacement scope depends on the language:

-   English: replace one word with CMU Arpabet.
-   Chinese: replace one character or syllable with tone-number pinyin.
-   Japanese: replace a short Japanese word or phrase with OpenJTalk-style romaji and pitch accent markers.

## English

CMU Arpabet examples for names, homographs, acronyms, and technical terms.

## Chinese

Tone-number pinyin examples for multi-character words, tones, and polyphonic characters.

## Japanese

OpenJTalk romaji phonemes with pitch accent digits.

### 

[​

](https://docs.fish.audio/developer-guide/core-features/fine-grained-control#quick-examples)

Quick Examples

English:

```
I am an <|phoneme_start|>EH1 N JH AH0 N IH1 R<|phoneme_end|>.
```

Chinese:

```
我是一个<|phoneme_start|>gong1<|phoneme_end|><|phoneme_start|>cheng2<|phoneme_end|><|phoneme_start|>shi1<|phoneme_end|>。
```

Japanese:

```
<|phoneme_start|>ha0shi1ga0<|phoneme_end|>見えます。
```

## 

[​

](https://docs.fish.audio/developer-guide/core-features/fine-grained-control#paralanguage)

Paralanguage

Paralanguage controls allow you to add natural speech elements and pauses to make the generated speech sound more human-like. There are two main types of controls:

### 

[​

](https://docs.fish.audio/developer-guide/core-features/fine-grained-control#pause-words)

Pause Words

You can use common pause words like “um”, “uh”, “嗯”, “啊” to control the rhythm of the speech.

### 

[​

](https://docs.fish.audio/developer-guide/core-features/fine-grained-control#special-effects)

Special Effects

The following special effects can be added using parentheses:

| Effect | Description | First Available | Stage |
| --- | --- | --- | --- |
| `(break)` | Short pause | V1.6 | Experimental |
| `(long-break)` | Extended pause | V1.6 | Experimental |
| `(breath)` | Breathing sound | V1.6 | Experimental |
| `(laugh)` | Laughter sound | V1.6 | Experimental |
| `(cough)` | Coughing sound | V1.6 | Experimental |
| `(lip-smacking)` | Lip smacking sound | V1.6 | Experimental |
| `(sigh)` | Sighing sound | V1.6 | Experimental |

The effects `(laugh)`, `(cough)`, `(lip-smacking)`, and `(sigh)` are developing. You may need to repeat them multiple times for better results.

Example:

```
I am, um, an (break) engineer.
```

You can combine paralanguage and phoneme control in the same text:

```
I am, um, an (break) <|phoneme_start|>EH1 N JH AH0 N IH1 R<|phoneme_end|>.
```

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/core-features/fine-grained-control.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/core-features/fine-grained-control)
