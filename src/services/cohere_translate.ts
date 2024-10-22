import { CohereClient } from "cohere-ai";
import { SUPPORTED_LANGUAGES } from '../constants';
import { type FromLanguage, type Language } from '../types';

const apiKey = import.meta.env.VITE_COHERE_API_KEY;

const cohere = new CohereClient({
    token: apiKey
});

export async function translate({
    fromLanguage,
    toLanguage,
    text
}: {
    fromLanguage: FromLanguage;
    toLanguage: Language;
    text: string;
}) {
    if (fromLanguage === toLanguage) return text;

    const systemPrompt = `You are a translator AI. Your only task is to translate the given text.
DO NOT introduce yourself or add any additional text.
DO NOT explain anything.
ONLY return the direct translation of the text.

The format will be: {text} {{from_language}} [[to_language]]

Examples:
Input: Hola mundo {{Español}} [[English]]
Output: Hello world

Input: How are you? {{English}} [[Deutsch]]
Output: Wie geht es dir?`;

    const fromCode = fromLanguage === 'auto' ? 'auto' : SUPPORTED_LANGUAGES[fromLanguage];
    const toCode = SUPPORTED_LANGUAGES[toLanguage];

    const response = await cohere.chat({
        model: 'command',
        message: `${text} {{${fromCode}}} [[${toCode}]]`,
        preamble: systemPrompt,
        temperature: 0.3
    });

    return response.text.trim();
}