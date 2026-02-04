import dotenv from "dotenv";

dotenv.config();

async function testDirectFetch() {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.error("❌ NVIDIA_API_KEY is missing in .env");
    return;
  }

  console.log(`🔑 Testing API Key: ${apiKey.substring(0, 10)}...`);

  // Try 3.1 70B Indstruct which is very stable
  const model = "meta/llama-3.1-70b-instruct";

  console.log(`🤖 Testing Model: ${model}`);

  try {
    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: "Say hello!" }],
          temperature: 0.5,
          top_p: 1,
          max_tokens: 1024,
        }),
      },
    );

    if (!response.ok) {
      console.error(`❌ Failed with status: ${response.status}`);
      console.error(`Status text: ${response.statusText}`);
      try {
        const errorBody = await response.text();
        console.error("Error Body:", errorBody);
      } catch (e) {
        console.error("Could not read error body");
      }
    } else {
      const data = await response.json();
      console.log("✅ Success!");
      console.log("Response:", data.choices[0].message.content);
    }
  } catch (error) {
    console.error("❌ Network error:", error);
  }
}

testDirectFetch();
