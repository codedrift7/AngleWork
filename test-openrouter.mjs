import "dotenv/config";

const models = [
  "z-ai/glm-5.2:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];

const schema = {
  type: "object",
  properties: {
    product: { type: "string" },
    idealCustomer: { type: "string" },
    primaryPain: { type: "string" },
    desiredOutcome: { type: "string" },
    valueProposition: { type: "string" },
    differentiators: {
      type: "array",
      items: { type: "string" },
    },
    objections: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "product",
    "idealCustomer",
    "primaryPain",
    "desiredOutcome",
    "valueProposition",
    "differentiators",
    "objections",
  ],
  additionalProperties: false,
};

const prompt = `
You are the Product Analyst for Anglework, an AI marketing
campaign planning application.

Analyze this product:

Anglework helps founders and small marketing teams turn a
product idea into a complete marketing campaign. It analyzes
the product, identifies the ideal customer and pain points,
develops positioning and an AIDA strategy, generates campaign
assets, critiques the campaign, and produces a launch plan.

Return a concise but strategically useful product analysis.
Do not invent specific customer statistics or unsupported claims.
`;

for (const model of models) {
  console.log("\n========================================");
  console.log(`MODEL: ${model}`);
  console.log("========================================");

  const start = Date.now();

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Anglework",
        },
        body: JSON.stringify({
          model,

          messages: [
            {
              role: "system",
              content:
                "You are a strategic marketing analyst. Follow the requested JSON schema exactly.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],

          response_format: {
            type: "json_schema",
            json_schema: {
              name: "product_analysis",
              strict: true,
              schema,
            },
          },

          max_tokens: 1500,
        }),
      }
    );

    const elapsed = Date.now() - start;
    const data = await response.json();

    console.log(`HTTP status: ${response.status}`);
    console.log(`Latency: ${elapsed} ms`);

    if (!response.ok) {
      console.log("ERROR:");
      console.log(JSON.stringify(data, null, 2));
      continue;
    }

    const content = data.choices?.[0]?.message?.content;

    console.log("\nSTRUCTURED OUTPUT:");
    console.log(content);

    if (data.usage) {
      console.log("\nUSAGE:");
      console.log(JSON.stringify(data.usage, null, 2));
    }

  } catch (error) {
    console.log("REQUEST FAILED:");
    console.log(error.message);
  }
}