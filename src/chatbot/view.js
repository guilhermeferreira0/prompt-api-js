import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.2.6/+esm";

export class ChatBotView {
  #elements;
  #controller = null;
  #generating = false;

  constructor() {
    this.#elements = {
      chat: document.querySelector('#chat'),
      toggle: document.querySelector('#toggle'),
      close: document.querySelector('#close'),
      form: document.querySelector('#form'),
      input: document.querySelector('#input'),
      messages: document.querySelector('#messages'),
      loading: document.querySelector('#loading'),
      cancel: document.querySelector('#cancel'),
      send: document.querySelector('#send'),
    };
  }

  setupEventHandlers({ onSend } = {}) {
    const el = this.#elements;

    el.toggle.onclick = () => el.chat.classList.toggle('hidden');
    el.close.onclick = () => el.chat.classList.add('hidden');
    el.cancel.onclick = () => this.#controller?.abort();

    el.form.onsubmit = async (e) => {
      e.preventDefault();

      const text = el.input.value.trim();
      if (!text || this.#generating) return;

      this.#appendMessage(text, 'user');
      el.input.value = '';

      const answer = this.#appendMessage('', 'assistant');

      this.#setLoading(true);
      this.#controller = new AbortController();

      try {
        let markdown = '';
        await onSend?.(text, (chunk) => {
          markdown += chunk;
          answer.innerHTML = DOMPurify.sanitize(marked.parse(markdown));
          this.#scroll();
        }, this.#controller.signal);

      } catch (error) {
        if (error.name === 'AbortError') {
          answer.textContent += '\n\n[Gerar resposta cancelada]';
        } else {
          answer.textContent = 'Não foi possível gerar a resposta.';
          console.error(error);
        }
      } finally {
        this.#controller = null;
        this.#setLoading(false);
      }
    };
  }

  #setLoading(value) {
    this.#generating = value;
    this.#elements.loading.classList.toggle('hidden', !value);
    this.#elements.send.disabled = value;
    this.#elements.send.classList.toggle('opacity-40', value);
    this.#scroll();
  }

  #appendMessage(text, role) {
    const message = document.createElement('div');

    message.className = role === 'user'
      ? 'ml-auto max-w-[85%] bg-white/[.07] border border-white/[.04] rounded-2xl rounded-tr-sm p-3.5 text-sm leading-6 text-gray-200 fade-in whitespace-pre-wrap'
      : 'mr-auto max-w-[95%] p-1 text-sm leading-7 text-gray-300 fade-in whitespace-pre-wrap';

    if (role === 'user') {
      message.textContent = text;
    } else {
      message.innerHTML = DOMPurify.sanitize(
        marked.parse(text || '')
      );
    }

    this.#elements.messages.append(message);
    this.#scroll();

    return message;
  }

  #scroll() {
    const m = this.#elements.messages;
    m.scrollTop = m.scrollHeight;
  }
}
