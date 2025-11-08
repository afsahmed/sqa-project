
const fs = require('fs/promises');
const path = require('path');
const dotenv = require('dotenv');
const OpenAI = require('openai');

(async () => {
    try {
        const projectRoot = path.resolve(__dirname, '..');
        dotenv.config({ path: path.join(projectRoot, '.env') });

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('Missing OPENAI_API_KEY in environment variables.');
        }

        const unitReportPath = path.join(projectRoot, 'reports', 'unit', 'unit-test.json');
        const loadReportPath = path.join(projectRoot, 'reports', 'load', 'statistics.json');

        const [unitReportRaw, loadReportRaw] = await Promise.all([
            fs.readFile(unitReportPath, 'utf8'),
            fs.readFile(loadReportPath, 'utf8')
        ]);

        const unitReport = JSON.parse(unitReportRaw);
        const loadReport = JSON.parse(loadReportRaw);

        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const prompt = `
You are a senior software quality engineer. Create a consolidated SOFTWARE QUALITY METRICS REPORT using the following inputs.

INPUT 1 – UNIT TEST RESULTS (JSON)
${JSON.stringify(unitReport, null, 2)}

INPUT 2 – LOAD TEST STATISTICS (JSON)
${JSON.stringify(loadReport, null, 2)}

Produce a CLEAN, PLAIN-TEXT report (no Markdown tables) with the following sections in this order:

1. REPORT TITLE (single line, all caps)
2. EXECUTIVE SUMMARY (2-3 short paragraphs)
3. KEY METRICS (neatly formatted list with labels and values; use aligned colons)
4. COMPARATIVE INSIGHTS (bullet list)
5. RISKS & ANOMALIES (bullet list)
6. RECOMMENDATIONS
   - Immediate (bullets)
   - Short Term (bullets)
   - Long Term (bullets)
7. NEXT QA STEPS (numbered list)

Rules:
- Keep the tone professional and concise.
- Do not include Markdown syntax (no # headings, no tables, no bold/italic).
- Use blank lines between major sections to improve readability.
- When citing numbers, include units (ms, %, req/sec) where appropriate.`;

        const response = await client.responses.create({
            model: 'gpt-4.1',
            input: [
                { role: 'system', content: 'You are an expert software quality analyst who writes clear, data-driven summaries.' },
                { role: 'user', content: prompt }
            ],
            max_output_tokens: 1200
        });

        const reportContent = (response.output_text || '').trim();

        if (!reportContent)
            throw new Error('Received empty response from OpenAI.');

        const metricsDir = path.join(projectRoot, 'reports', 'metrics');
        await fs.mkdir(metricsDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputPath = path.join(metricsDir, `quality-metrics-${timestamp}.txt`);

        await fs.writeFile(outputPath, reportContent, 'utf8');

        console.log(`Quality metrics report generated at: ${outputPath}`);
    } catch (error) {
        console.log({ error });
        console.error('Failed to generate quality metrics report:', error.message);
        process.exitCode = 1;
    }
})();

