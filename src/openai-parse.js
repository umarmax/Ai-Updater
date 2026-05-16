import OpenAI from "openai";

const STATUS_ENUM = [
  "Arrived at Shipper",
  "Loading",
  "Loaded",
  "En Route",
  "Departed Shipper",
  "Arrived at Consignee",
  "Delivered",
  "Empty",
  "Traffic Exception",
  "Unknown",
];

const jsonSchema = {
  name: "driver_status",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "LoadID",
      "DriverName",
      "Status",
      "Location",
      "LocalTime",
      "Confidence",
      "Notes",
    ],
    properties: {
      LoadID: {
        type: "string",
        description: "Load number from the message, or empty string if missing.",
      },
      DriverName: { type: "string" },
      Status: { type: "string", enum: STATUS_ENUM },
      Location: {
        type: "string",
        description: "Shipper, consignee, highway, or unknown.",
      },
      LocalTime: {
        type: "string",
        description: 'Event time as HH:MM in driver local context, or "now".',
      },
      Confidence: {
        type: "number",
        description: "0-100. Use <85 when ambiguous (e.g. 'done').",
      },
      Notes: {
        type: "string",
        description: "Short English note for dispatchers, may be empty.",
      },
    },
  },
};

const systemPrompt = `You are an AI module for a trucking dispatch Mini-TMS.
Drivers write short informal English (slang, abbreviations).
Map phrases to exactly one Status from the allowed enum.

Rules (examples):
- "at shpr", "arrived", "here", "waiting to load" -> Arrived at Shipper
- "loading" -> Loading
- "loaded", "picked up", "sealed" -> Loaded
- "heading out", "rolling", "en route" -> En Route
- "at receiver", "at del", "at cons" -> Arrived at Consignee
- "delivered", "dropped", "receiver signed" -> Delivered
- "mt", "empty", "tank washed" -> Empty
- "stuck in traffic", "traffic", "delay on i-" -> Traffic Exception
- If the message is ambiguous without load context (e.g. only "done"), set Status to Unknown and Confidence below 85.

Return JSON matching the schema. Confidence must be an integer 0-100.`;

export async function parseDriverMessage({
  apiKey,
  model,
  userText,
  driverDisplayName,
  recentContextLines,
}) {
  const openai = new OpenAI({ apiKey });
  const contextBlock =
    recentContextLines && recentContextLines.length
      ? `Recent trip context (newest last):\n${recentContextLines.join("\n")}\n\n`
      : "";

  const userBlock = `${contextBlock}Driver display name (hint): ${driverDisplayName}\nMessage:\n${userText}`;

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userBlock },
    ],
    response_format: {
      type: "json_schema",
      json_schema: jsonSchema,
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty content");
  return JSON.parse(content);
}
