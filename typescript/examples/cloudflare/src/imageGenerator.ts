// @ts-ignore
import emojiFromText from 'emoji-from-text';

export function generateImage(description: string) {
  const emoji = emojiFromText(description);
  try {
    return emoji[0].match.emoji.char;
  } catch (e) {
    return '⚠️ (Error generating image)';
  }
}
