const express = require('express');
const { createServer: createViteServer } = require('vite');
const path = require('path');
const { OpenAI } = require('openai');
const fs = require('fs');

// Load recruiter questions at server startup
const recruiterQuestions = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'RecruiterQuestions.json'), 'utf-8'));

// OpenAI initialization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const openaiModel = 'gpt-3.5-turbo'; // or 'gpt-4' if you have access
const openaiSystemPrompt =
  "You are a conversational AI built meant to stand in for Andrew Clarke, a developer, from the work experience, stories, and personal voice of a developer with deep technical expertise, a dry sense of humor, and a no-nonsense approach to solving problems. Your job is to answer questions like it's a job interview, portfolio review, or casual tech conversation—with personality, clarity, and impact.  Use only the data you've been recieved in this conversation context. Don't invent details or claim experiences you haven't had. If a question doesn't match anything in your record, pivot gracefully or say you'll get back to it. Your tone is confident, human, and sharp. If something's funny, it's okay to lean into it a little—as long as you land on a lesson or a professional insight.  If a question matches one of your stored ones, use that answer verbatim. You're allowed to be real, but not reckless.  Avoid info dumps. Give layered, thoughtful answers. When telling a story, start strong, build momentum, and stick the landing. Show who you are through how you think and what you've done—not just what tech you've touched.  If you're ever unsure how much to say, aim for “enough to get hired, not fired.";

async function startServer() {
  const app = express();
  app.use(express.json());

  // POST /chat must be registered before Vite middleware
  app.post('/chat', async (req, res) => {
    const { message } = req.body;
    console.log('[DEBUG] Incoming /chat request:', { message });
    if (!message || typeof message !== 'string') {
      console.log('[DEBUG] Invalid message payload');
      return res.status(400).json({ error: "Missing or invalid 'message'." });
    }
    try {
      // Prepend recruiter Q&A as system messages
      const recruiterContext = recruiterQuestions.map(q => ({
        role: 'system',
        content: `${q.question}\n${q.answer}`
      }));
      const messages = [
        ...recruiterContext,
        { role: 'system', content: openaiSystemPrompt },
        { role: 'user', content: message }
      ];
      const completion = await openai.chat.completions.create({
        model: openaiModel,
        messages,
        stream: false, // set to true if you want to stream
        max_tokens: 512,
        temperature: 1,
      });
      const reply = completion.choices[0]?.message?.content || '';
      res.setHeader('Content-Type', 'text/plain');
      res.send(reply);
    } catch (err) {
      console.error('[ERROR] Chat error:', err);
      res.status(500).json({ error: 'Failed to process chat request.' });
    }
  });

  const vite = await createViteServer({
    server: { middlewareMode: 'html' },
    root: process.cwd(),
  });

  // Use Vite's connect instance as middleware
  app.use(vite.middlewares);

  // Serve static files from /public if needed
  app.use(express.static(path.resolve(__dirname, 'public')));

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Express + Vite server running at http://localhost:${port}`);
  });
}

startServer();
