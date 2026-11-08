// @ts-check

import { ChatBotModel } from './src/chatbot/model.js';
import { ChatBotView } from './src/chatbot/view.js';

(async () => {
  const [systemPrompt] = await Promise.all([
      fetch('./src/config/prompt.md').then(r => r.text())
  ]);
  const model = new ChatBotModel();
  await model.init(systemPrompt);

  const view = new ChatBotView();

  view.setupEventHandlers({
    onSend: async (text, onChunk, signal) => {
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      await sleep(1000);

      const response = await model.prompt(text, { signal });
      const chunks = [];

      for await (const chunk of response) {
        signal.throwIfAborted();

        chunks.push(chunk);
        onChunk(chunk);
      }

      const fullResponse = chunks.join('');
      console.log(fullResponse);
    }
  });
})()