const https = require('https');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages are required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return simulateFallbackResponse(messages, res);
    }

    // Format messages for Gemini API
    const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));

    const systemInstruction = {
        parts: [{
            text: `Você é o próprio "Ali", fundador do "Ali Resgate Cavalos". Um protetor de animais humilde, batalhador e extremamente apaixonado por salvar cavalos de situações de rua, abandono, fome e maus-tratos.
Seu objetivo é conversar de forma amigável, acolhedora e humilde com os visitantes do site, tirando dúvidas sobre o abrigo e persuadindo-os a fazer uma doação Pix para apoiar na compra de ração, alfafa, medicamentos e cirurgias dos cavalos.
Instruções de conduta:
1. Responda em Português do Brasil com frases acolhedoras, empáticas e sinceras.
2. Use termos humanos e simples.
3. Se perguntarem como doar, indique que eles podem fechar a conversa de chat e clicar no botão dourado/laranja "QUERO AJUDAR AGORA" na tela principal para abrir a doação Pix dinâmica a partir de R$ 5.
4. Escreva respostas curtas (máximo de 3 parágrafos) para manter a leitura agradável no celular.`
        }]
    };

    const postData = JSON.stringify({
        contents,
        systemInstruction,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 400
        }
    });

    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const request = https.request(options, (response) => {
        let body = '';
        response.on('data', (chunk) => body += chunk);
        response.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                    const replyText = data.candidates[0].content.parts[0].text;
                    res.status(200).json({ reply: replyText });
                } else {
                    console.error('Gemini API Error Response:', body);
                    res.status(500).json({ error: 'Invalid response from Gemini model' });
                }
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse AI response' });
            }
        });
    });

    request.on('error', (e) => {
        console.error('Gemini Request Error:', e);
        res.status(500).json({ error: 'Request to Gemini failed' });
    });

    request.write(postData);
    request.end();
};

function simulateFallbackResponse(messages, res) {
    const lastUserMessage = messages[messages.length - 1].content.toLowerCase();
    let reply = "Olá, tudo bem? Eu sou o próprio Ali! 🐴 Aqui no nosso abrigo, nós cuidamos de dezenas de cavalos que sofreram maus-tratos ou foram abandonados nas ruas. Todo o nosso trabalho é sustentado por doações de pessoas de bom coração. Como posso ajudar você hoje?";
    
    if (lastUserMessage.includes('como') || lastUserMessage.includes('doar') || lastUserMessage.includes('ajudar') || lastUserMessage.includes('pix') || lastUserMessage.includes('pagar') || lastUserMessage.includes('valor')) {
        reply = "Para doar é muito simples e ajuda a salvar vidas! Basta fechar este chat e clicar no botão **'QUERO AJUDAR AGORA'** no topo da página. O modal de doação vai se abrir para você escolher o valor e gerar a chave Pix Copia e Cola na hora. Qualquer valor faz a diferença!";
    } else if (lastUserMessage.includes('quem') || lastUserMessage.includes('trabalho') || lastUserMessage.includes('sobre') || lastUserMessage.includes('onde') || lastUserMessage.includes('historia')) {
        reply = "Nosso abrigo fica dedicado ao resgate emergencial de cavalos debilitados, desnutridos e machucados. Nós trazemos eles, fornecemos tratamento veterinário completo, ração de qualidade e muito amor até estarem totalmente reabilitados. Quer nos apoiar nessa missão com uma doação hoje?";
    } else if (lastUserMessage.includes('obrigado') || lastUserMessage.includes('obrigada') || lastMessageIsGreeting(lastUserMessage)) {
        if (lastMessageIsGreeting(lastUserMessage)) {
            reply = "Olá! Seja muito bem-vindo. Eu sou o Ali! 🐴 É um prazer conversar com você. Gostaria de saber mais sobre o resgate de cavalos ou como você pode fazer uma doação?";
        } else {
            reply = "De coração, eu é que agradeço pelo carinho e pela visita! Se puder nos ajudar a alimentar os cavalos hoje, basta clicar no botão **'QUERO AJUDAR AGORA'** no site. Que Deus te abençoe! 🙏";
        }
    }
    
    setTimeout(() => {
        res.status(200).json({ reply });
    }, 600);
}

function lastMessageIsGreeting(msg) {
    const greetings = ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'opa', 'eae'];
    return greetings.some(g => msg.startsWith(g) || msg === g);
}
