// Biografias vem do catalogo num bloco so. Para ler bem, a primeira frase vira destaque e o resto vai em paragrafos curtos
// (mesma regra do app Android).

export type BioText = { lead: string; paragraphs: string[] };

// Quebra depois de ponto final/exclamacao/interrogacao quando a proxima frase comeca com maiuscula. Exige duas letras
// minusculas (ou digitos) antes do ponto, para nao partir em abreviacoes como "Dr." ou "Jr.".
const SENTENCE_BREAK = /(?<=[a-zà-ÿ0-9)]{2}[.!?])\s+(?=[A-ZÀ-Ý"“])/;

const PARAGRAPH_TARGET = 230;

export function splitBio(text: string): BioText {
  const sentences = text
    .trim()
    .split(SENTENCE_BREAK)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  if (sentences.length === 0) return { lead: '', paragraphs: [] };

  const paragraphs: string[] = [];
  let current = '';
  for (const sentence of sentences.slice(1)) {
    if (current && current.length + sentence.length > PARAGRAPH_TARGET) {
      paragraphs.push(current);
      current = '';
    }
    current = current ? `${current} ${sentence}` : sentence;
  }
  if (current) paragraphs.push(current);
  return { lead: sentences[0], paragraphs };
}
