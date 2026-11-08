
export class ChatBotModel {
    #messages = []
    #session = null
    #options = {
        expectedInputs: [
            { type: 'text', languages: ['en'] }
        ],
        expectedOutputs: [
            { type: 'text', languages: ['en'] }
        ]
    }

    async init(initialPrompts) {
        if (this.#session) return this.#session

        if (!window.LanguageModel) {
            throw new Error('LanguageModel API não está disponível')
        }

        this.#messages.push({
            role: 'system',
            content: initialPrompts
        })

        await this.#createSession()

        if (!this.#session) {
            throw new Error('Não foi possível criar a sessão')
        }

        return this.#session
    }

    async #createSession() {
        const availability = await LanguageModel.availability(this.#options);

        if (availability != 'available') {
            throw new Error('LanguageModel API não está disponível')
        }

        this.#session = await LanguageModel.create({
            ...this.#options,
            initialPrompts: this.#messages,
            monitor(m) {
              m.addEventListener('downloadprogress', (e) => {
                console.log(`Downloaded ${e.loaded * 100}%`);
              });
            },
        })

        return this.#session
    }

    prompt(text, options = {}) {
        if (!this.#session) {
            throw new Error('A sessão do assistente ainda não está pronta')
        }
        return this.#session.promptStreaming(text, options)
    }
}